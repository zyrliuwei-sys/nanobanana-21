import { createFileRoute } from '@tanstack/react-router';

import { resolveImageCredits } from '@/config/image-gen';
import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

// Public: credits one image costs at each resolution (generator + pricing).
async function GET() {
  try {
    return respData({ credits: resolveImageCredits(await getAllConfigs()) });
  } catch (error: any) {
    return respErr(error?.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/image/price')({
  server: { handlers: { GET } },
});
