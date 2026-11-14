import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  readLocalUpload,
  uploadGeneratedImage,
} from '@/routes/api/image/-shared';

import { getStorage } from '@/modules/storage/service';
import {
  createImagePreview,
  openImageOriginal,
  sealImageOriginal,
} from '@/lib/image-original';

type StoredFreeImage = {
  version: 1;
  original: string;
  preview: string;
  contentType: string;
};
const LOCAL_ORIGINAL = /^private:([\w-]{16,64})$/;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function storedImage(value: string): StoredFreeImage | null {
  try {
    const image = JSON.parse(value);
    return image?.version === 1 &&
      typeof image.original === 'string' &&
      typeof image.preview === 'string' &&
      typeof image.contentType === 'string'
      ? image
      : null;
  } catch {
    return null;
  }
}

async function sourceImage(url: string) {
  if (url.startsWith('/')) {
    const local = await readLocalUpload(url);
    if (!local) throw new Error('Image not found');
    return { body: new Uint8Array(local.body), contentType: local.contentType };
  }
  const parsed = new URL(url);
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  )
    throw new Error('Invalid image source');
  const response = await fetch(parsed, { signal: AbortSignal.timeout(60_000) });
  if (
    !response.ok ||
    !response.body ||
    Number(response.headers.get('content-length')) > MAX_FILE_BYTES
  )
    throw new Error('Image unavailable');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_FILE_BYTES) {
      await reader.cancel();
      throw new Error('Image is too large');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return {
    body,
    contentType:
      response.headers.get('content-type')?.split(';')[0] || 'image/png',
  };
}

/** The database stores private original metadata, never a public plaintext original. */
export async function persistFreeImage(
  id: string,
  source: string
): Promise<string> {
  if (!/^[\w-]{16,64}$/.test(id)) throw new Error('Invalid image ID');
  const { body, contentType } = await sourceImage(source);
  if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(contentType))
    throw new Error('Unsupported image');
  const previewBytes = await createImagePreview(body);
  const encrypted = await sealImageOriginal(body, id);
  const storage = await getStorage();
  let original: string;
  if (storage) {
    const saved = await storage.uploadFile({
      body: encrypted,
      key: `image-originals/${id}.bin`,
      contentType: 'application/octet-stream',
    });
    if (!saved.success || !saved.url)
      throw new Error('Unable to store original image');
    original = saved.url;
  } else {
    const directory = path.join(process.cwd(), 'data', 'private-images');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${id}.bin`), encrypted);
    original = `private:${id}`;
  }
  const preview = await uploadGeneratedImage({
    body: previewBytes,
    key: `image-previews/${id}.jpg`,
    contentType: 'image/jpeg',
  });
  return JSON.stringify({
    version: 1,
    original,
    preview: preview.url,
    contentType,
  } satisfies StoredFreeImage);
}

export async function readFreePreview(stored: string) {
  const image = storedImage(stored);
  if (image) return sourceImage(image.preview);
  // Legacy trial images are also reduced before serving through the protected route.
  const source = await sourceImage(stored);
  return {
    body: await createImagePreview(source.body),
    contentType: 'image/jpeg',
  };
}

/** Only call after ownership and paid access have both been checked. */
export async function readFreeOriginal(stored: string, id: string) {
  const image = storedImage(stored);
  if (!image) return sourceImage(stored);
  const local = LOCAL_ORIGINAL.exec(image.original);
  if (local && local[1] !== id) throw new Error('Invalid original image');
  const encrypted = local
    ? new Uint8Array(
        await readFile(
          path.join(process.cwd(), 'data', 'private-images', `${local[1]}.bin`)
        )
      )
    : (await sourceImage(image.original)).body;
  return {
    body: await openImageOriginal(encrypted, id),
    contentType: image.contentType,
  };
}
