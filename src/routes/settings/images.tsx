import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Download, ImagePlus, Loader2 } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { apiGet, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type ImageRow = {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  imageUrl: string | null;
  aspectRatio: string | null;
  resolution: string | null;
  createdAt: string;
};

const PAGE_SIZE = 12;

function ImagesPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['image-history', page],
    queryFn: () =>
      apiGet<PageResult<ImageRow>>(
        `/api/image/history?page=${page}&pageSize=${PAGE_SIZE}`
      ),
    placeholderData: keepPreviousData,
  });
  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{m['settings.images.title']()}</h1>
        <p className="text-muted-foreground">
          {m['settings.images.description']()}
        </p>
      </div>

      {query.isPending ? (
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      ) : rows.length === 0 ? (
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-muted-foreground">
              {m['settings.images.empty']()}
            </p>
            <Link href="/#create" className={cn(buttonVariants(), 'gap-2')}>
              <ImagePlus className="size-4" />
              {m['settings.images.create']()}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <Card key={row.id} className="overflow-hidden py-0">
              <div className="bg-muted flex aspect-square w-full items-center justify-center">
                {row.status === 'success' && row.imageUrl ? (
                  <a href={row.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={row.imageUrl}
                      alt={row.prompt}
                      loading="lazy"
                      className="size-full object-contain"
                    />
                  </a>
                ) : (
                  <span
                    className={cn(
                      'px-4 text-center text-sm',
                      row.status === 'failed'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {row.status === 'failed'
                      ? m['settings.images.status_failed']()
                      : m['settings.images.status_pending']()}
                  </span>
                )}
              </div>
              <CardContent className="space-y-3 pb-4">
                <p className="line-clamp-2 text-sm">{row.prompt}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">
                    {[row.resolution, row.aspectRatio]
                      .filter(Boolean)
                      .join(' · ')}
                    {' · '}
                    {new Date(row.createdAt).toLocaleDateString()}
                  </span>
                  {row.status === 'success' && row.imageUrl && (
                    <a
                      href={`/api/image/download?id=${row.id}`}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'gap-1.5'
                      )}
                    >
                      <Download className="size-4" />
                      {m['settings.images.download']()}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center gap-3">
          <button
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {m['settings.images.prev']()}
          </button>
          <span className="text-muted-foreground text-sm">
            {page} / {pages}
          </span>
          <button
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            {m['settings.images.next']()}
          </button>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/settings/images')({
  component: ImagesPage,
});
