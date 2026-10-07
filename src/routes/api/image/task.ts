import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { findTask } from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

import { findFreeTask, getVisitor, ownsFreeTask, syncFreeTask } from './-free';
import { syncImageTask } from './-task';

// Poll an image task (paid or free trial); advances it with Evolink when
// unfinished. Free tasks are owned by the account or the device cookie.
async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id ?? null;
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!id) return respErr('Not found');

    if (userId) {
      const task = await findTask(id);
      if (task && task.userId === userId && !task.deletedAt) {
        return respData({
          ...(await syncImageTask(task, await getAllConfigs())),
          tier: 'paid',
        });
      }
    }

    const free = await findFreeTask(id);
    if (!free || !ownsFreeTask(free, await getVisitor(request), userId)) {
      return respErr('Not found');
    }
    return respData(await syncFreeTask(free, await getAllConfigs()));
  } catch (error: any) {
    console.error('[image] task poll failed:', error);
    return respErr('Internal error');
  }
}

export const Route = createFileRoute('/api/image/task')({
  server: { handlers: { GET } },
});
