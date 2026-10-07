import { createFileRoute } from '@tanstack/react-router';

import {
  resolveImageCredits,
  resolveReferenceCredits,
} from '@/config/image-gen';
import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

// Public: credits per image by resolution, plus per reference image.
async function GET() {
  try {
    const configs = await getAllConfigs();
    return respData({
      credits: resolveImageCredits(configs),
      referenceCredits: resolveReferenceCredits(configs),
    });
  } catch (error: any) {
    console.error('[image] price failed:', error);
    return respErr('Internal error');
  }
}

export const Route = createFileRoute('/api/image/price')({
  server: { handlers: { GET } },
});
