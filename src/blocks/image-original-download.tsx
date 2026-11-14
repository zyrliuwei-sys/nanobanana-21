import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, Loader2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { apiPost } from '@/lib/api-client';
import {
  PENDING_ORIGINAL_DOWNLOAD,
  recalledImage,
  rememberImage,
} from '@/lib/image-download';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';

const PaywallDialog = lazy(() => import('@/blocks/paywall-dialog'));

/** The server authorizes every download, including direct requests to the binary endpoint. */
export function ImageOriginalDownload({
  id,
  trial = false,
}: {
  id: string;
  trial?: boolean;
}) {
  const { data: session } = useSession();
  const [paywall, setPaywall] = useState(false);
  const [mounted, setMounted] = useState(false);
  const resumed = useRef('');
  const access = useMutation({
    mutationFn: () =>
      apiPost<{ downloadUrl: string }>('/api/image/download-access', { id }),
    onSuccess: (data) => {
      rememberImage(PENDING_ORIGINAL_DOWNLOAD, null);
      window.location.assign(data.downloadUrl);
    },
    onError: (error: Error) => {
      if (error.message === 'PAYMENT_REQUIRED') {
        setMounted(true);
        setPaywall(true);
      } else toast.error(m['studio.download_failed']());
    },
  });

  // A verified checkout returns to this page. Resume the original, rather than generating another image.
  useEffect(() => {
    const key = `${session?.user?.id}:${id}`;
    if (
      !session?.user ||
      recalledImage(PENDING_ORIGINAL_DOWNLOAD) !== id ||
      resumed.current === key
    )
      return;
    resumed.current = key;
    access.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, id]);

  return (
    <>
      <button
        type="button"
        disabled={access.isPending}
        onClick={() => {
          rememberImage(PENDING_ORIGINAL_DOWNLOAD, id);
          access.mutate();
        }}
        aria-label={m['studio.download_original']()}
        title={m['studio.download_original']()}
        className={cn(
          'border-border hover:bg-accent focus-visible:ring-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium outline-none focus-visible:ring-2 disabled:opacity-50',
          trial && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {access.isPending ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : trial ? (
          <LockKeyhole aria-hidden className="size-4" />
        ) : (
          <Download aria-hidden className="size-4" />
        )}
        {m['studio.download_original']()}
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <PaywallDialog
            open={paywall}
            onOpenChange={setPaywall}
            title={m['studio.original.paywall_title']()}
            description={m['studio.original.paywall_description']()}
          />
        </Suspense>
      )}
    </>
  );
}
