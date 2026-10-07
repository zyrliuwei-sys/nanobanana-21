import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { findTask } from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

import { syncImageTask } from './-task';

// Poll one of the user's image tasks; advances it with Evolink when unfinished.
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
    return respData(await syncImageTask(task, await getAllConfigs()));
  } catch (error: any) {
    console.error('[image] task poll failed:', error);
    return respErr('Internal error');
  }
}

export const Route = createFileRoute('/api/image/task')({
  server: { handlers: { GET } },
});
