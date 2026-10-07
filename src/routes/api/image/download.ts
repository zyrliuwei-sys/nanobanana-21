import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { findTask } from '@/modules/ai-tasks/service';
import { respErr } from '@/lib/resp';

// Stream one of the user's generated images back as an attachment
// (a cross-origin storage URL can't be force-downloaded from the browser).
async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const id = new URL(request.url).searchParams.get('id') || '';
    const task = id ? await findTask(id) : null;
    if (!task || task.userId !== session.user.id || task.deletedAt) {
      return respErr('Not found');
    }
    let imageUrl = '';
    try {
      imageUrl = JSON.parse((task.taskResult as string) || '{}').imageUrl;
    } catch {
      // fall through
    }
    if (!imageUrl) return respErr('Not found');

    const upstream = await fetch(new URL(imageUrl, request.url));
    if (!upstream.ok || !upstream.body) return respErr('Download failed');
    const type = upstream.headers.get('content-type') || 'image/png';
    const ext = type.split('/')[1]?.split(';')[0] || 'png';
    return new Response(upstream.body, {
      headers: {
        'content-type': type,
        'content-disposition': `attachment; filename="nanobanana-${task.id.slice(0, 8)}.${ext}"`,
        'cache-control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    return respErr(error?.message || 'Download failed');
  }
}

export const Route = createFileRoute('/api/image/download')({
  server: { handlers: { GET } },
});
