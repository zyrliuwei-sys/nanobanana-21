import { createFileRoute } from '@tanstack/react-router';

import { respData, respErr } from '@/lib/resp';

import { authorizeImageDownload, ImageDownloadError } from './-download-access';

async function POST({ request }: { request: Request }) {
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  try {
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id : '';
    await authorizeImageDownload(request, id);
    return respData(
      { downloadUrl: `/api/image/download?id=${encodeURIComponent(id)}` },
      { headers }
    );
  } catch (error) {
    if (error instanceof ImageDownloadError)
      return respErr(error.message, { status: error.status, headers });
    console.error('[image] download access failed:', error);
    return respErr('Download failed', { status: 500, headers });
  }
}

export const Route = createFileRoute('/api/image/download-access')({
  server: { handlers: { POST } },
});
