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

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const body = await request.json().catch(() => null);
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return respErr('Prompt is required');
    if (prompt.length > MAX_PROMPT_LENGTH) return respErr('Prompt is too long');
    const aspectRatio: AspectRatio = isAspectRatio(body?.aspectRatio)
      ? body.aspectRatio
      : DEFAULT_ASPECT_RATIO;
    const resolution: ImageResolution = isImageResolution(body?.resolution)
      ? body.resolution
      : DEFAULT_RESOLUTION;

    const configs = await getAllConfigs();
    const references = await resolveReferenceUrls(body?.images, configs);
    if (!references) return respErr('Invalid reference image');
    if (references.length > MAX_REFERENCE_IMAGES) {
      return respErr(`Up to ${MAX_REFERENCE_IMAGES} reference images`);
    }
    // Evolink downloads references itself: they must be public storage URLs
    // (the local no-storage fallback inlines data: URLs it can't use).
    if (references.some((url) => !url.startsWith('https://'))) {
      return respErr('STORAGE_REQUIRED');
    }

    if (!(await screenPrompt(prompt, configs)).allowed) {
      return respErr(PROMPT_BLOCKED);
    }

    const client = evolinkFromConfigs(configs);
    if (!client) return respErr('Generation is not configured');

    // Admins generate free; checked first so an unpaid user always lands on
    // the paywall. Price = 7x Evolink cost (see config/image-gen.ts).
    const isAdmin = await hasPermission(session.user.id, 'admin.*');
    const price = imageCost(
      resolveImageCredits(configs),
      resolveReferenceCredits(configs),
      resolution,
      references.length
    );
    if (!isAdmin && (await getBalance(session.user.id)) < price) {
      return respErr(INSUFFICIENT_CREDITS);
    }

    const model = configs.nano_banana_model || DEFAULT_IMAGE_MODEL;
    // Consumes the credits atomically; refunded if the task fails.
    const task = await createTask({
      userId: session.user.id,
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
      return respErr('GENERATION_FAILED');
    }

    // The client polls /api/image/task?id=... until it finishes.
    return respData(
      taskView({
        ...task,
        taskInfo: JSON.stringify({ aspectRatio, resolution }),
        costCredits: isAdmin ? 0 : price,
      })
    );
  } catch (error: any) {
    if (error?.message === INSUFFICIENT_CREDITS) {
      return respErr(INSUFFICIENT_CREDITS);
    }
    console.error('[image] generate error:', error);
    return respErr('Generate failed');
  }
}

export const Route = createFileRoute('/api/image/generate')({
  server: { handlers: { POST } },
});
