/**
 * Free trial images: generated with the cheap Nano Banana 2 Lite route on
 * Evolink to let visitors try the product before paying.
 *
 *   - signed out: 1 free image per device (cookie) and at most
 *     ANON_PER_IP_PER_DAY per IP
 *   - signed in:  1 more free image per account, at most USER_PER_IP_PER_DAY
 *     accounts' free images per IP (stops sign-up farming)
 *   - a site-wide daily cap (admin `free_trial_daily_cap`) bounds the cost
 *
 * Free generations never touch credits. They are stored in the `hotel_preview`
 * table (originally built for the same job: IP/device-tracked free previews),
 * so no schema migration is needed:
 *   quality -> tier ('anon' | 'user'), size -> aspect ratio,
 *   request_id -> Evolink task id, task_id -> model used,
 *   scene_image_url -> result URL.
 */
import { and, count, eq, gte, isNotNull, ne } from 'drizzle-orm';

import { db } from '@/core/db';
import { hotelPreview as freeTrial } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

import { uploadGeneratedImage } from './-shared';
import { evolinkFromConfigs } from './-task';

/** Official Lite route: $0.029/image, reliable (~10s). */
export const DEFAULT_FREE_MODEL = 'gemini-3.1-flash-lite-image';
/**
 * Used when the configured model rejects the submission. Note the cheaper
 * beta route (`nano-banana-2-lite-beta`, $0.018) can also accept a task and
 * fail later for lack of capacity; that surfaces as a failed (uncounted)
 * free image the visitor can retry.
 */
const FALLBACK_FREE_MODEL = DEFAULT_FREE_MODEL;
export const DEFAULT_FREE_DAILY_CAP = 300;
const ANON_PER_IP_PER_DAY = 2;
const USER_PER_IP_PER_DAY = 3;
const DAY_MS = 24 * 60 * 60_000;
const TASK_TIMEOUT_MS = 10 * 60_000;

const DEVICE_COOKIE = 'nb_did';

export type FreeTier = 'anon' | 'user';
type FreeRow = typeof freeTrial.$inferSelect;

export type FreeTaskView = {
  id: string;
  tier: 'free';
  status: 'pending' | 'success' | 'failed';
  progress: number;
  imageUrl: string | null;
  aspectRatio: string;
  resolution: '1K';
  costCredits: 0;
};

// --- Visitor identity -----------------------------------------------------

export type Visitor = { deviceId: string; ipHash: string; newDevice: boolean };

function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([\\w-]{16,64})`));
  return match?.[1] ?? null;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getVisitor(request: Request): Promise<Visitor> {
  const existing = readCookie(request, DEVICE_COOKIE);
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  // Salted so stored hashes can't be reversed into IPs by lookup tables.
  const ipHash = await sha256(`${process.env.AUTH_SECRET || 'nb'}:${ip}`);
  return {
    deviceId: existing ?? getUuid(),
    ipHash,
    newDevice: !existing,
  };
}

/** Attach the device cookie to a response when it was just issued. */
export function withDeviceCookie(resp: Response, visitor: Visitor) {
  if (!visitor.newDevice) return resp;
  const headers = new Headers(resp.headers);
  headers.append(
    'Set-Cookie',
    `${DEVICE_COOKIE}=${visitor.deviceId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
  );
  return new Response(resp.body, { status: resp.status, headers });
}

// --- Allowance --------------------------------------------------------------

const notFailed = ne(freeTrial.status, 'failed');

async function countRows(where: ReturnType<typeof and>) {
  const [row] = await db().select({ n: count() }).from(freeTrial).where(where);
  return Number(row?.n ?? 0);
}

/**
 * Which free image (if any) this visitor may generate now.
 * Returns the tier to use, or the reason none is available.
 */
export async function freeAllowance(
  visitor: Visitor,
  userId: string | null,
  configs: Record<string, string>
): Promise<{ tier: FreeTier } | { blocked: 'USED' | 'PAUSED' }> {
  const since = new Date(Date.now() - DAY_MS);

  const capRaw = Number(configs.free_trial_daily_cap);
  const cap =
    configs.free_trial_daily_cap?.trim() && Number.isFinite(capRaw)
      ? capRaw
      : DEFAULT_FREE_DAILY_CAP;
  if (cap <= 0) return { blocked: 'PAUSED' };
  if (
    (await countRows(and(notFailed, gte(freeTrial.createdAt, since)))) >= cap
  ) {
    return { blocked: 'PAUSED' };
  }

  if (userId) {
    const usedByAccount = await countRows(
      and(notFailed, eq(freeTrial.userId, userId))
    );
    if (usedByAccount > 0) return { blocked: 'USED' };
    const usedOnIp = await countRows(
      and(
        notFailed,
        isNotNull(freeTrial.userId),
        eq(freeTrial.ipHash, visitor.ipHash),
        gte(freeTrial.createdAt, since)
      )
    );
    return usedOnIp >= USER_PER_IP_PER_DAY
      ? { blocked: 'USED' }
      : { tier: 'user' };
  }

  const usedByDevice = await countRows(
    and(
      notFailed,
      eq(freeTrial.deviceId, visitor.deviceId),
      eq(freeTrial.quality, 'anon')
    )
  );
  if (usedByDevice > 0) return { blocked: 'USED' };
  const usedOnIp = await countRows(
    and(
      notFailed,
      eq(freeTrial.quality, 'anon'),
      eq(freeTrial.ipHash, visitor.ipHash),
      gte(freeTrial.createdAt, since)
    )
  );
  return usedOnIp >= ANON_PER_IP_PER_DAY
    ? { blocked: 'USED' }
    : { tier: 'anon' };
}

// --- Tasks -------------------------------------------------------------------

export function freeView(row: FreeRow, progress = 0): FreeTaskView {
  const status =
    row.status === 'success'
      ? 'success'
      : row.status === 'failed'
        ? 'failed'
        : 'pending';
  return {
    id: row.id,
    tier: 'free',
    status,
    progress: status === 'success' ? 100 : progress,
    imageUrl: row.sceneImageUrl ?? null,
    aspectRatio: row.size,
    resolution: '1K',
    costCredits: 0,
  };
}

export async function createFreeTask(params: {
  visitor: Visitor;
  userId: string | null;
  tier: FreeTier;
  prompt: string;
  aspectRatio: string;
  references: string[];
  configs: Record<string, string>;
}): Promise<FreeTaskView> {
  const client = evolinkFromConfigs(params.configs);
  if (!client) throw new Error('Generation is not configured');
  const [row] = await db()
    .insert(freeTrial)
    .values({
      id: getUuid(),
      ipHash: params.visitor.ipHash,
      deviceId: params.visitor.deviceId,
      userId: params.userId,
      status: 'pending',
      size: params.aspectRatio,
      quality: params.tier,
    })
    .returning();
  const model = params.configs.free_image_model?.trim() || DEFAULT_FREE_MODEL;
  const submit = (m: string) =>
    client.submitImage({
      model: m,
      prompt: params.prompt,
      size: params.aspectRatio,
      quality: '1K',
      imageUrls: params.references,
    });
  try {
    let used = model;
    let remote;
    try {
      remote = await submit(model);
    } catch (error) {
      if (model === FALLBACK_FREE_MODEL) throw error;
      used = FALLBACK_FREE_MODEL;
      remote = await submit(used);
    }
    await db()
      .update(freeTrial)
      .set({ requestId: remote.id, taskId: used })
      .where(eq(freeTrial.id, row.id));
    return freeView({ ...row, requestId: remote.id, taskId: used });
  } catch (error: any) {
    await db()
      .update(freeTrial)
      .set({
        status: 'failed',
        error: String(error?.message || error).slice(0, 500),
      })
      .where(eq(freeTrial.id, row.id));
    throw error;
  }
}

export async function findFreeTask(id: string) {
  const [row] = await db()
    .select()
    .from(freeTrial)
    .where(eq(freeTrial.id, id))
    .limit(1);
  return row ?? null;
}

export function ownsFreeTask(
  row: FreeRow,
  visitor: Visitor,
  userId: string | null
) {
  return (
    (!!userId && row.userId === userId) || row.deviceId === visitor.deviceId
  );
}

async function setFree(id: string, patch: Partial<FreeRow>) {
  await db().update(freeTrial).set(patch).where(eq(freeTrial.id, id));
}

/** Advance a free task with Evolink (same contract as syncImageTask). */
export async function syncFreeTask(
  row: FreeRow,
  configs: Record<string, string>
): Promise<FreeTaskView> {
  if (row.status === 'success' || row.status === 'failed') return freeView(row);
  const age = Date.now() - new Date(row.createdAt).getTime();
  const client = evolinkFromConfigs(configs);
  if (!row.requestId || !client) {
    if (age > 2 * 60_000) {
      await setFree(row.id, { status: 'failed', error: 'not submitted' });
      return freeView({ ...row, status: 'failed' });
    }
    return freeView(row);
  }

  let remote;
  try {
    remote = await client.getTask(row.requestId);
  } catch {
    return freeView(row);
  }

  if (
    remote.status === 'failed' ||
    (remote.status !== 'completed' && age > TASK_TIMEOUT_MS)
  ) {
    const error =
      remote.error?.message ||
      (remote.status === 'failed' ? 'failed' : 'timed out');
    await setFree(row.id, { status: 'failed', error: error.slice(0, 500) });
    return freeView({ ...row, status: 'failed' });
  }

  if (remote.status === 'completed' && remote.results[0]) {
    // Claim pending -> processing so concurrent polls copy the image once.
    const claimed = await db()
      .update(freeTrial)
      .set({ status: 'processing' })
      .where(and(eq(freeTrial.id, row.id), eq(freeTrial.status, 'pending')))
      .returning({ id: freeTrial.id });
    if (!claimed.length)
      return freeView((await findFreeTask(row.id)) ?? row, 95);
    let imageUrl = remote.results[0];
    try {
      const resp = await fetch(imageUrl, {
        signal: AbortSignal.timeout(60_000),
      });
      const contentType = resp.headers.get('content-type') || 'image/png';
      const ext = contentType.split('/')[1]?.split(';')[0] || 'png';
      ({ url: imageUrl } = await uploadGeneratedImage({
        body: new Uint8Array(await resp.arrayBuffer()),
        key: `nano-banana-free/${getUuid()}.${ext}`,
        contentType,
      }));
    } catch (error) {
      console.error(
        '[image] free persist failed, keeping provider URL:',
        error
      );
    }
    await setFree(row.id, { status: 'success', sceneImageUrl: imageUrl });
    return freeView({ ...row, status: 'success', sceneImageUrl: imageUrl });
  }

  return freeView(row, Math.min(remote.progress, 90));
}
