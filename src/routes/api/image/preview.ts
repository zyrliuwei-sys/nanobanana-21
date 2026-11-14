import { createFileRoute } from '@tanstack/react-router';
import { readFreePreview } from '@/server/free-image-files';

import { getAuth } from '@/core/auth';
import { respErr } from '@/lib/resp';

import { findFreeTask, getVisitor, ownsFreeTask } from './-free';

async function GET({ request }: { request: Request }) {
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  try {
    const id = new URL(request.url).searchParams.get('id') || '';
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    const free = await findFreeTask(id);
    if (
      !free ||
      free.status !== 'success' ||
      !free.sceneImageUrl ||
      !ownsFreeTask(free, await getVisitor(request), session?.user?.id ?? null)
    )
      return respErr('Not found', { status: 404, headers });
    const preview = await readFreePreview(free.sceneImageUrl);
    return new Response(new Uint8Array(preview.body), {
      headers: {
        ...headers,
        'Content-Type': preview.contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[image] preview failed:', error);
    return respErr('Preview unavailable', { status: 500, headers });
  }
}

export const Route = createFileRoute('/api/image/preview')({
  server: { handlers: { GET } },
});
