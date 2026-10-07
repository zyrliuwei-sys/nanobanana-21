import { createFileRoute } from '@tanstack/react-router';

import { AIMediaType } from '@/core/ai';
import { getAuth } from '@/core/auth';
import { getUserTasksPage } from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

import { syncImageTask, taskView } from './-task';

// The signed-in user's image generations, newest first.
async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Math.min(
      48,
      Math.max(1, Number(url.searchParams.get('pageSize')) || 12)
    );

    const { items, total } = await getUserTasksPage({
      userId: session.user.id,
      mediaType: AIMediaType.IMAGE,
      page,
      pageSize,
    });

    // Unfinished tasks (e.g. the tab was closed mid-generation) are advanced
    // here, so the image still lands in My images.
    const unfinished = items.some(
      (t) => t.status === 'pending' || t.status === 'processing'
    );
    const configs = unfinished ? await getAllConfigs() : {};
    const views = await Promise.all(
      items.map((task) =>
        task.status === 'pending' || task.status === 'processing'
          ? syncImageTask(task, configs).catch(() => taskView(task))
          : taskView(task)
      )
    );

    return respData({ total, items: views });
  } catch (error: any) {
    console.error('[image] history failed:', error);
    return respErr('Internal error');
  }
}

export const Route = createFileRoute('/api/image/history')({
  server: { handlers: { GET } },
});
