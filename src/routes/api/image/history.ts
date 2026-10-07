import { createFileRoute } from '@tanstack/react-router';

import { AIMediaType } from '@/core/ai';
import { getAuth } from '@/core/auth';
import { getUserTasksPage } from '@/modules/ai-tasks/service';
import { respData, respErr } from '@/lib/resp';

function parseJson(value: unknown): Record<string, any> {
  if (typeof value !== 'string' || !value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

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

    return respData({
      total,
      items: items.map((task) => {
        const info = parseJson(task.taskInfo);
        const result = parseJson(task.taskResult);
        return {
          id: task.id,
          prompt: task.prompt,
          status: task.status,
          imageUrl: result.imageUrl ?? null,
          aspectRatio: info.aspectRatio ?? null,
          resolution: info.resolution ?? null,
          costCredits: task.costCredits,
          createdAt: task.createdAt,
        };
      }),
    });
  } catch (error: any) {
    console.error('[image] history failed:', error);
    return respErr('Internal error');
  }
}

export const Route = createFileRoute('/api/image/history')({
  server: { handlers: { GET } },
});
