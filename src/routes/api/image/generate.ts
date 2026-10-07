import { createFileRoute } from '@tanstack/react-router';

import { AIMediaType, GeminiProvider } from '@/core/ai';
import { getAuth } from '@/core/auth';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_RESOLUTION,
  isAspectRatio,
  isImageResolution,
  MAX_PROMPT_LENGTH,
  MAX_REFERENCE_IMAGES,
  resolveImageCredits,
  type AspectRatio,
  type ImageResolution,
} from '@/config/image-gen';
import {
  AITaskStatus,
  createTask,
  mergeTaskInfo,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { screenPrompt } from '@/modules/content-safety/service';
import { getBalance } from '@/modules/credits/service';
import { hasPermission } from '@/modules/rbac/service';
import { getUuid } from '@/lib/hash';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

import { resolveReferenceUrls, uploadGeneratedImage } from './-shared';

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
    const references = resolveReferenceUrls(body?.images, request.url, configs);
    if (!references) return respErr('Invalid reference image');
    if (references.length > MAX_REFERENCE_IMAGES) {
      return respErr(`Up to ${MAX_REFERENCE_IMAGES} reference images`);
    }

    if (!(await screenPrompt(prompt, configs)).allowed) {
      return respErr(PROMPT_BLOCKED);
    }

    // Admins generate free; checked first so an unpaid user always lands on
    // the paywall.
    const isAdmin = await hasPermission(session.user.id, 'admin.*');
    const price = resolveImageCredits(configs)[resolution];
    if (!isAdmin && (await getBalance(session.user.id)) < price) {
      return respErr(INSUFFICIENT_CREDITS);
    }

    const apiKey = configs.gemini_api_key;
    if (!apiKey) return respErr('Generation is not configured');
    const model = configs.nano_banana_model || DEFAULT_IMAGE_MODEL;

    const task = await createTask({
      userId: session.user.id,
      mediaType: AIMediaType.IMAGE,
      provider: 'gemini',
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
      const provider = new GeminiProvider({
        apiKey,
        uploadFile: uploadGeneratedImage,
        uuid: getUuid,
      });
      const result = await provider.generate({
        params: {
          mediaType: AIMediaType.IMAGE,
          model,
          prompt,
          options: {
            image_input: references,
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: resolution,
            },
          },
        },
      });
      const imageUrl = result.taskInfo?.images?.[0]?.imageUrl;
      if (!imageUrl) throw new Error('no image returned');

      await updateTask({
        taskId: task.id,
        status: AITaskStatus.SUCCESS,
        taskResult: { imageUrl },
      });
      return respData({
        id: task.id,
        imageUrl,
        prompt,
        aspectRatio,
        resolution,
        credits: isAdmin ? 0 : price,
      });
    } catch (error: any) {
      console.error('[image] generation failed:', error?.message);
      await updateTask({
        taskId: task.id,
        status: AITaskStatus.FAILED,
        taskResult: { error: String(error?.message || error).slice(0, 500) },
      });
      return respErr('GENERATION_FAILED');
    }
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
