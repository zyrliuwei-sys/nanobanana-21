import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { UploadFileFunction } from '@/core/ai/types';
import { getStorage } from '@/modules/storage/service';

const LOCAL_UPLOAD_RE = /^\/uploads\/[\w-]+\.(?:jpe?g|png|webp|gif)$/i;

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Read a local-fallback upload (`/uploads/<file>`) straight from disk.
 * Never fetched over HTTP: resolving it against `request.url` would trust the
 * Host header and let a spoofed host turn this into a server-side fetch.
 * The regex above already rules out traversal (`[\w-]+` + fixed extension).
 */
export async function readLocalUpload(
  urlPath: string
): Promise<{ body: Buffer; contentType: string } | null> {
  if (!LOCAL_UPLOAD_RE.test(urlPath)) return null;
  const file = path.join(process.cwd(), 'public', urlPath);
  const ext = urlPath.split('.').pop()!.toLowerCase();
  try {
    return { body: await readFile(file), contentType: MIME[ext] };
  } catch {
    return null;
  }
}

function hostOf(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(/^https?:\/\//.test(value) ? value : `https://${value}`)
      .host;
  } catch {
    return null;
  }
}

/**
 * Reference images must come from our own upload endpoint (local
 * `/uploads/...` in dev, or the configured R2 public domain) — the server
 * fetches them, so arbitrary URLs would be an SSRF vector. Returns fetchable
 * URLs (storage https URLs or inline data: URLs), or null if any entry is not
 * allowed.
 */
export async function resolveReferenceUrls(
  input: unknown,
  configs: Record<string, string>
): Promise<string[] | null> {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return null;
  const storageHost = hostOf(configs.r2_domain);
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') return null;
    if (LOCAL_UPLOAD_RE.test(raw)) {
      // Local dev fallback: inline as a data: URL (the provider fetches it).
      const local = await readLocalUpload(raw);
      if (!local) return null;
      out.push(
        `data:${local.contentType};base64,${local.body.toString('base64')}`
      );
      continue;
    }
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }
    if (url.protocol !== 'https:' || !storageHost || url.host !== storageHost) {
      return null;
    }
    out.push(url.href);
  }
  return out;
}

/**
 * Persist a generated image: R2 when configured, else `public/uploads`
 * (local dev only — Workers have no writable disk).
 */
export const uploadGeneratedImage: UploadFileFunction = async ({
  body,
  key,
  contentType,
}) => {
  const storage = await getStorage();
  if (storage) {
    const result = await storage.uploadFile({
      body,
      key,
      contentType,
      disposition: 'inline',
    });
    if (!result.success || !result.url) {
      throw new Error(result.error || 'Upload failed');
    }
    return { url: result.url };
  }
  const filename = key.split('/').pop() as string;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), body);
  return { url: `/uploads/${filename}` };
};
