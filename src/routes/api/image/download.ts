import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { findTask } from '@/modules/ai-tasks/service';
import { respErr } from '@/lib/resp';

import { findFreeTask, getVisitor, ownsFreeTask } from './-free';
import { readLocalUpload } from './-shared';

// Stream one of the user's generated images back as an attachment
// (a cross-origin storage URL can't be force-downloaded from the browser).
async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id ?? null;

    const id = new URL(request.url).searchParams.get('id') || '';
    let imageUrl = '';
    const task = id && userId ? await findTask(id) : null;
    if (task && task.userId === userId && !task.deletedAt) {
      try {
        imageUrl = JSON.parse((task.taskResult as string) || '{}').imageUrl;
      } catch {
        // fall through
      }
    } else if (id) {
      // Free trial image: owned by the account or the device cookie.
      const free = await findFreeTask(id);
      if (free && ownsFreeTask(free, await getVisitor(request), userId)) {
        imageUrl = free.sceneImageUrl ?? '';
      }
    }
    if (!imageUrl) return respErr('Not found');

    // Local dev fallback files are read from disk; storage URLs are absolute
    // https URLs written by the server itself.
    let body: BodyInit;
    let type: string;
    if (imageUrl.startsWith('/')) {
      const local = await readLocalUpload(imageUrl);
      if (!local) return respErr('Not found');
      body = new Uint8Array(local.body);
      type = local.contentType;
    } else {
      const upstream = await fetch(imageUrl);
      if (!upstream.ok || !upstream.body) return respErr('Download failed');
      body = upstream.body;
      type = upstream.headers.get('content-type') || 'image/png';
    }
    const ext = type.split('/')[1]?.split(';')[0] || 'png';
    return new Response(body, {
      headers: {
        'content-type': type,
        'content-disposition': `attachment; filename="nanobanana-${id.slice(0, 8)}.${ext}"`,
        'cache-control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('[image] download failed:', error);
    return respErr('Download failed');
  }
}

export const Route = createFileRoute('/api/image/download')({
  server: { handlers: { GET } },
});
