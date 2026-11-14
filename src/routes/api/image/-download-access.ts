import { getAuth } from '@/core/auth';
import { findTask } from '@/modules/ai-tasks/service';
import {
  claimImagePreview,
  hasPaidImageDownloads,
} from '@/modules/image-downloads/service';
import { hasPermission } from '@/modules/rbac/service';

import { findFreeTask, getVisitor, ownsFreeTask } from './-free';

export class ImageDownloadError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Used by both the UI access check and the actual binary download endpoint. */
export async function authorizeImageDownload(request: Request, id: string) {
  if (!/^[\w-]{8,128}$/.test(id))
    throw new ImageDownloadError('Not found', 404);
  const session = await getAuth().api.getSession({ headers: request.headers });
  const userId = session?.user?.id ?? null;
  const task = userId ? await findTask(id) : null;
  if (
    task &&
    task.userId === userId &&
    !task.deletedAt &&
    task.status === 'success'
  ) {
    let imageUrl: unknown;
    try {
      imageUrl = JSON.parse(task.taskResult || '{}').imageUrl;
    } catch {
      /* Not a valid image result. */
    }
    if (typeof imageUrl === 'string' && imageUrl)
      return { tier: 'paid' as const, imageUrl };
  }
  const free = await findFreeTask(id);
  const visitor = await getVisitor(request);
  if (
    !free ||
    free.status !== 'success' ||
    !free.sceneImageUrl ||
    !ownsFreeTask(free, visitor, userId)
  )
    throw new ImageDownloadError('Not found', 404);
  if (!userId) throw new ImageDownloadError('PAYMENT_REQUIRED', 402);
  const [purchased, admin] = await Promise.all([
    hasPaidImageDownloads(userId),
    hasPermission(userId, 'admin.*'),
  ]);
  if (!purchased && !admin)
    throw new ImageDownloadError('PAYMENT_REQUIRED', 402);
  if (!(await claimImagePreview(id, userId, visitor.deviceId)))
    throw new ImageDownloadError('Not found', 404);
  return { tier: 'free' as const, stored: free.sceneImageUrl };
}
