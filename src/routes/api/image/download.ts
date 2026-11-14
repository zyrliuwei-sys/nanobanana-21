import { createFileRoute } from '@tanstack/react-router';
import { readFreeOriginal } from '@/server/free-image-files';

import { respErr } from '@/lib/resp';

import { authorizeImageDownload, ImageDownloadError } from './-download-access';
import { readLocalUpload } from './-shared';

// Stream one of the user's generated images back as an attachment
// (a cross-origin storage URL can't be force-downloaded from the browser).
async function GET({ request }: { request: Request }) {
  try {
    const id = new URL(request.url).searchParams.get('id') || '';
    const access = await authorizeImageDownload(request, id);
    let imageUrl = '';
    if (access.tier === 'paid') imageUrl = access.imageUrl;

    // Local dev fallback files are read from disk; storage URLs are absolute
    // https URLs written by the server itself.
    let body: BodyInit;
    let type: string;
    if (access.tier === 'free') {
      const original = await readFreeOriginal(access.stored, id);
      body = new Uint8Array(original.body);
      type = original.contentType;
    } else if (imageUrl.startsWith('/')) {
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
        'cache-control': 'private, no-store',
        vary: 'Cookie',
      },
    });
  } catch (error: any) {
    if (error instanceof ImageDownloadError)
      return respErr(error.message, {
        status: error.status,
        headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
      });
    console.error('[image] download failed:', error);
    return respErr('Download failed');
  }
}

export const Route = createFileRoute('/api/image/download')({
  server: { handlers: { GET } },
});
