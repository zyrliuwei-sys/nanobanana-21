import { createFileRoute } from '@tanstack/react-router';

import { AIMediaType } from '@/core/ai';
import { getAuth } from '@/core/auth';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_RESOLUTION,
  imageCost,
  isAspectRatio,
  isImageResolution,
  MAX_PROMPT_LENGTH,
  MAX_REFERENCE_IMAGES,
  resolveImageCredits,
  resolveReferenceCredits,
  type AspectRatio,
  type ImageResolution,
} from '@/config/image-gen';
import {
  AITaskStatus,
  createTask,
  mergeTaskInfo,
  setProviderTaskId,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { screenPrompt } from '@/modules/content-safety/service';
import { getBalance } from '@/modules/credits/service';
import { hasPermission } from '@/modules/rbac/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

import {
  createFreeTask,
  freeAllowance,
  getVisitor,
  withDeviceCookie,
  type Visitor,
} from './-free';
import { resolveReferenceUrls } from './-shared';
import { evolinkFromConfigs, taskView } from './-task';

const INSUFFICIENT_CREDITS = 'Insufficient credits';
const PROMPT_BLOCKED = 'PROMPT_BLOCKED';

async function POST({ request }: { request: Request }) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 2000,
    keyPrefix: 'image-generate',
  });
  if (limited) return limited;

  // Created up front so every response can carry the device cookie.
  let visitor: Visitor | null = null;
  const reply = (resp: Response) =>
    visitor ? withDeviceCookie(resp, visitor) : resp;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id ?? null;
    visitor = await getVisitor(request);

    const body = await request.json().catch(() => null);
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return reply(respErr('Prompt is required'));
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return reply(respErr('Prompt is too long'));
    }
    const aspectRatio: AspectRatio = isAspectRatio(body?.aspectRatio)
      ? body.aspectRatio
      : DEFAULT_ASPECT_RATIO;
    const resolution: ImageResolution = isImageResolution(body?.resolution)
      ? body.resolution
      : DEFAULT_RESOLUTION;

    const configs = await getAllConfigs();
    const references = await resolveReferenceUrls(body?.images, configs);
    if (!references) return reply(respErr('Invalid reference image'));
    if (references.length > MAX_REFERENCE_IMAGES) {
      return reply(respErr(`Up to ${MAX_REFERENCE_IMAGES} reference images`));
    }
    // Uploads need an account, so signed-out requests can't carry references.
    if (references.length && !userId) return reply(respErr('Unauthorized'));
    // Evolink downloads references itself: they must be public storage URLs
    // (the local no-storage fallback inlines data: URLs it can't use).
    if (references.some((url) => !url.startsWith('https://'))) {
      return reply(respErr('STORAGE_REQUIRED'));
    }

    if (!(await screenPrompt(prompt, configs)).allowed) {
      return reply(respErr(PROMPT_BLOCKED));
    }

    const client = evolinkFromConfigs(configs);
    if (!client) return reply(respErr('Generation is not configured'));

    // Paid path (Nano Banana 2.1): signed-in users with enough credits, and
    // admins. Price = 7x Evolink cost (see config/image-gen.ts).
    const price = imageCost(
      resolveImageCredits(configs),
      resolveReferenceCredits(configs),
      resolution,
      references.length
    );
    const isAdmin = userId ? await hasPermission(userId, 'admin.*') : false;
    const balance = userId ? await getBalance(userId) : 0;
    const canPay = !!userId && (isAdmin || balance >= price);

    // Has credits but not enough for this request: they're a paying user,
    // so offer a top-up rather than a downgraded free image.
    if (!canPay && userId && balance > 0) {
      return reply(respErr(INSUFFICIENT_CREDITS));
    }

    if (!canPay) {
      // Free trial (Nano Banana 2 Lite, 1K): 1 signed out + 1 signed in.
      const allowance = await freeAllowance(visitor, userId, configs);
      if ('blocked' in allowance) {
        if (allowance.blocked === 'PAUSED') {
          return reply(respErr(userId ? INSUFFICIENT_CREDITS : 'FREE_PAUSED'));
        }
        // Used up: signed-out visitors get one more after signing in.
        return reply(
          respErr(userId ? INSUFFICIENT_CREDITS : 'FREE_USED_SIGN_IN')
        );
      }
      try {
        const view = await createFreeTask({
          visitor,
          userId,
          tier: allowance.tier,
          prompt,
          aspectRatio,
          references,
          configs,
        });
        return reply(respData(view));
      } catch (error: any) {
        console.error('[image] free submit failed:', error?.message);
        return reply(respErr('GENERATION_FAILED'));
      }
    }

    const model = configs.nano_banana_model || DEFAULT_IMAGE_MODEL;
    // Consumes the credits atomically; refunded if the task fails.
    const task = await createTask({
      userId: userId!,
      mediaType: AIMediaType.IMAGE,
      provider: 'evolink',
      model,
      prompt,
      costCredits: isAdmin ? 0 : price,
    });
    await mergeTaskInfo(task.id, {
      aspectRatio,
      resolution,
      references: references.length,
    });

    try {
      const remote = await client.submitImage({
        model,
        prompt,
        size: aspectRatio,
        quality: resolution,
        imageUrls: references,
      });
      await setProviderTaskId(task.id, remote.id);
    } catch (error: any) {
      console.error('[image] evolink submit failed:', error?.message);
      await updateTask({
        taskId: task.id,
        status: AITaskStatus.FAILED,
        taskResult: { error: String(error?.message || error).slice(0, 500) },
      });
      return reply(respErr('GENERATION_FAILED'));
    }

    // The client polls /api/image/task?id=... until it finishes.
    return reply(
      respData({
        ...taskView({
          ...task,
          taskInfo: JSON.stringify({ aspectRatio, resolution }),
          costCredits: isAdmin ? 0 : price,
        }),
        tier: 'paid',
      })
    );
  } catch (error: any) {
    if (error?.message === INSUFFICIENT_CREDITS) {
      return reply(respErr(INSUFFICIENT_CREDITS));
    }
    console.error('[image] generate error:', error);
    return reply(respErr('Generate failed'));
  }
}

export const Route = createFileRoute('/api/image/generate')({
  server: { handlers: { POST } },
});
