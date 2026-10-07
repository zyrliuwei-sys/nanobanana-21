import { EvolinkClient } from '@/core/ai/evolink';
import type { AiTask } from '@/config/db/schema';
import {
  AITaskStatus,
  claimTaskStatus,
  findTask,
  mergeTaskInfo,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getUuid } from '@/lib/hash';

import { uploadGeneratedImage } from './-shared';

/** Give up (and refund) when Evolink hasn't finished after this long. */
const TASK_TIMEOUT_MS = 15 * 60_000;
/** A finalizer that crashed mid-copy releases its claim after this long. */
const STALE_CLAIM_MS = 3 * 60_000;

export type ImageTaskView = {
  id: string;
  status: 'pending' | 'success' | 'failed';
  progress: number;
  imageUrl: string | null;
  prompt: string;
  aspectRatio: string | null;
  resolution: string | null;
  costCredits: number;
  createdAt: Date;
};

function parseJson(value: unknown): Record<string, any> {
  if (typeof value !== 'string' || !value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function taskView(task: AiTask, progress = 0): ImageTaskView {
  const info = parseJson(task.taskInfo);
  const result = parseJson(task.taskResult);
  const status =
    task.status === AITaskStatus.SUCCESS
      ? 'success'
      : task.status === AITaskStatus.FAILED
        ? 'failed'
        : 'pending';
  return {
    id: task.id,
    status,
    progress: status === 'success' ? 100 : progress,
    imageUrl: result.imageUrl ?? null,
    prompt: task.prompt,
    aspectRatio: info.aspectRatio ?? null,
    resolution: info.resolution ?? null,
    costCredits: task.costCredits ?? 0,
    createdAt: task.createdAt,
  };
}

export function evolinkFromConfigs(configs: Record<string, string>) {
  const key = configs.evolink_api_key?.trim();
  return key ? new EvolinkClient(key, configs.evolink_base_url) : null;
}

/**
 * Copy the Evolink result (a 24h link) into our storage. Falls back to the
 * Evolink URL when storage isn't configured, so the user still gets the image.
 */
async function persistResult(sourceUrl: string): Promise<string> {
  try {
    const resp = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(60_000),
    });
    if (!resp.ok) throw new Error(`download ${resp.status}`);
    const contentType = resp.headers.get('content-type') || 'image/png';
    const ext = contentType.split('/')[1]?.split(';')[0] || 'png';
    const body = new Uint8Array(await resp.arrayBuffer());
    const { url } = await uploadGeneratedImage({
      body,
      key: `nano-banana/${getUuid()}.${ext}`,
      contentType,
    });
    return url;
  } catch (error) {
    console.error('[image] persist failed, keeping provider URL:', error);
    return sourceUrl;
  }
}

async function fail(task: AiTask, reason: string) {
  // updateTask(FAILED) revokes the consumed credits.
  await updateTask({
    taskId: task.id,
    status: AITaskStatus.FAILED,
    taskResult: { error: reason.slice(0, 500) },
  });
  return taskView({ ...task, status: AITaskStatus.FAILED });
}

/**
 * Advance one unfinished image task by asking Evolink for its state:
 * completed -> copy the image + SUCCESS; failed / timed out -> FAILED (and
 * refund). Safe to call concurrently: finishing is guarded by an atomic
 * PENDING -> PROCESSING claim.
 */
export async function syncImageTask(
  task: AiTask,
  configs: Record<string, string>
): Promise<ImageTaskView> {
  if (task.status === AITaskStatus.SUCCESS) return taskView(task);
  if (task.status === AITaskStatus.FAILED) return taskView(task);

  const age = Date.now() - new Date(task.createdAt).getTime();

  // Another request is copying the result; free a claim that went stale.
  if (task.status === AITaskStatus.PROCESSING) {
    const since = Date.now() - new Date(task.updatedAt).getTime();
    if (since < STALE_CLAIM_MS) return taskView(task, 95);
    await claimTaskStatus(
      task.id,
      AITaskStatus.PROCESSING,
      AITaskStatus.PENDING
    );
    task = { ...task, status: AITaskStatus.PENDING };
  }

  if (!task.taskId) {
    // Submission never recorded a provider id (crashed mid-request).
    return age > 2 * 60_000 ? fail(task, 'not submitted') : taskView(task);
  }

  const client = evolinkFromConfigs(configs);
  if (!client) return taskView(task);

  let remote;
  try {
    remote = await client.getTask(task.taskId);
  } catch (error) {
    console.error('[image] evolink status check failed:', error);
    return age > TASK_TIMEOUT_MS
      ? fail(task, 'status unavailable')
      : taskView(task);
  }

  if (remote.status === 'failed') {
    return fail(task, remote.error?.message || remote.error?.code || 'failed');
  }

  if (remote.status === 'completed') {
    const source = remote.results[0];
    if (!source) return fail(task, 'no image returned');
    if (
      !(await claimTaskStatus(
        task.id,
        AITaskStatus.PENDING,
        AITaskStatus.PROCESSING
      ))
    ) {
      // Someone else is finishing it; report its current state.
      const latest = await findTask(task.id);
      return taskView(latest ?? task, 95);
    }
    const imageUrl = await persistResult(source);
    if (remote.usageUsd !== undefined) {
      await mergeTaskInfo(task.id, { providerCostUsd: remote.usageUsd });
    }
    await updateTask({
      taskId: task.id,
      status: AITaskStatus.SUCCESS,
      taskResult: { imageUrl },
    });
    return taskView({
      ...task,
      status: AITaskStatus.SUCCESS,
      taskResult: JSON.stringify({ imageUrl }),
    });
  }

  if (age > TASK_TIMEOUT_MS) return fail(task, 'timed out');
  return taskView(task, Math.min(remote.progress, 90));
}
