import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import { getBalance } from '@/modules/credits/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

import { freeAllowance, getVisitor } from './-free';

// What the generator button should offer this visitor right now.
async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id ?? null;
    const [configs, visitor] = await Promise.all([
      getAllConfigs(),
      getVisitor(request),
    ]);
    const [allowance, balance, isAdmin] = await Promise.all([
      freeAllowance(visitor, userId, configs),
      userId ? getBalance(userId) : Promise.resolve(0),
      userId ? hasPermission(userId, 'admin.*') : Promise.resolve(false),
    ]);
    return respData({
      signedIn: !!userId,
      balance,
      unlimited: isAdmin,
      // Free images only for visitors without credits (see generate.ts).
      freeAvailable: 'tier' in allowance && balance === 0,
    });
  } catch (error: any) {
    console.error('[image] quota failed:', error);
    return respErr('Internal error');
  }
}

export const Route = createFileRoute('/api/image/quota')({
  server: { handlers: { GET } },
});
