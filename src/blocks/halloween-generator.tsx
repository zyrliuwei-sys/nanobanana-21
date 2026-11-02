import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, ExternalLink, Loader2, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import {
  HALLOWEEN_BASE_PROMPT,
  HALLOWEEN_PRESETS,
} from '@/config/halloween-emoji';
import {
  DEFAULT_IMAGE_CREDITS,
  DEFAULT_RESOLUTION,
  isAspectRatio,
  type AspectRatio,
  type ImageResolution,
} from '@/config/image-gen';
import { apiGet, apiPost } from '@/lib/api-client';
import { track } from '@/lib/track';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';

const PaywallDialog = lazy(() => import('@/blocks/paywall-dialog'));

/** Sticker-friendly subset of the model's aspect ratios. */
const RATIOS: AspectRatio[] = ['1:1', '4:5', '9:16', '16:9'];

type TaskView = {
  id: string;
  tier?: 'free' | 'paid';
  status: 'pending' | 'success' | 'failed';
  progress: number;
  imageUrl: string | null;
  prompt?: string;
  aspectRatio: string | null;
};

type Quota = {
  signedIn: boolean;
  balance: number;
  unlimited: boolean;
  freeAvailable: boolean;
};

type Result = {
  id: string;
  imageUrl: string;
  prompt: string;
};

const POLL_MS = 2500;

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders — same convention as blocks/faq.tsx.
const PRESET_LABELS: Record<string, () => string> = {
  ghost: () => m['halloween.preset.ghost'](),
  pumpkin: () => m['halloween.preset.pumpkin'](),
  zombie: () => m['halloween.preset.zombie'](),
  cat: () => m['halloween.preset.cat'](),
  bat: () => m['halloween.preset.bat'](),
  skull: () => m['halloween.preset.skull'](),
};

function errorText(message: string) {
  if (message === 'PROMPT_BLOCKED') return m['studio.error.blocked']();
  if (message === 'GENERATION_FAILED') return m['studio.error.failed']();
  if (message === 'FREE_PAUSED') return m['studio.error.free_paused']();
  if (message === 'Generation is not configured') {
    return m['studio.error.not_configured']();
  }
  return message || m['studio.error.failed']();
}

/**
 * The Halloween emoji generator — a focused front end for the same
 * /api/image/generate + /api/image/task pipeline the homepage studio uses
 * (free trial, credits, paywall and download included).
 */
export function HalloweenGenerator() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [result, setResult] = useState<Result | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paywall, setPaywall] = useState(false);
  const [paywallMounted, setPaywallMounted] = useState(false);
  if (paywall && !paywallMounted) setPaywallMounted(true);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const usedPreset = useRef('');

  const { data: quota } = useQuery({
    queryKey: ['image-quota', session?.user?.id ?? 'anon'],
    queryFn: () => apiGet<Quota>('/api/image/quota'),
    staleTime: 30_000,
  });
  const { data: priceData } = useQuery({
    queryKey: ['image-price'],
    queryFn: () =>
      apiGet<{ credits: Record<ImageResolution, number> }>('/api/image/price'),
    staleTime: 10 * 60_000,
  });
  const cost = priceData?.credits?.['1K'] ?? DEFAULT_IMAGE_CREDITS['1K'];

  const taskQuery = useQuery({
    queryKey: ['image-task', taskId],
    queryFn: () =>
      apiGet<TaskView>(`/api/image/task?id=${encodeURIComponent(taskId!)}`),
    enabled: !!taskId,
    refetchInterval: (q) =>
      q.state.data && q.state.data.status !== 'pending' ? false : POLL_MS,
    retry: 3,
  });
  const task = taskQuery.data;

  useEffect(() => {
    if (!task || task.id !== taskId || task.status === 'pending') return;
    setTaskId(null);
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    queryClient.invalidateQueries({ queryKey: ['image-quota'] });
    if (task.status === 'success' && task.imageUrl) {
      setResult({
        id: task.id,
        imageUrl: task.imageUrl,
        prompt: task.prompt || '',
      });
      track('halloween_generate_success', { preset: usedPreset.current });
    } else {
      toast.error(m['studio.error.failed']());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, taskId]);

  useEffect(() => {
    if (taskQuery.isError && taskId) setTaskId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskQuery.isError, taskId]);

  function goSignIn() {
    router.push(
      `/sign-in?callbackUrl=${encodeURIComponent('/halloween-emoji')}`
    );
  }

  const generate = useMutation({
    mutationFn: () =>
      apiPost<TaskView>('/api/image/generate', {
        prompt: prompt.trim(),
        aspectRatio,
        // Stickers don't need upsampling; the free tier is 1K anyway.
        resolution: DEFAULT_RESOLUTION,
      }),
    onMutate: () => {
      setElapsed(0);
      track('halloween_generate_start', { preset: usedPreset.current });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      setTaskId(data.id);
    },
    onError: (e: Error) => {
      queryClient.invalidateQueries({ queryKey: ['image-quota'] });
      if (e.message === 'Insufficient credits') {
        track('halloween_paywall');
        setPaywall(true);
        return;
      }
      if (e.message === 'FREE_USED_SIGN_IN') {
        track('halloween_free_signin_prompt');
        toast(m['studio.free.signin_prompt'](), {
          action: { label: m['studio.free.signin_cta'](), onClick: goSignIn },
        });
        return;
      }
      toast.error(errorText(e.message));
    },
  });

  const busy = generate.isPending || !!taskId;
  const progress = taskId ? (task?.progress ?? 0) : 0;
  const canGenerate = prompt.trim().length > 0 && !busy;

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  function applyPreset(key: string, value: string) {
    usedPreset.current = key;
    setPrompt(value);
    promptInput.current?.focus();
  }

  function surprise() {
    const pick =
      HALLOWEEN_PRESETS[Math.floor(Math.random() * HALLOWEEN_PRESETS.length)];
    applyPreset(pick.key, pick.prompt);
  }

  // Free trial vs paid: the server decides; this only drives the button badge
  // (same semantics as blocks/studio.tsx).
  const canPay =
    !!quota?.signedIn && (quota.unlimited || quota.balance >= cost);
  const showFree = !canPay && (quota ? quota.freeAvailable !== false : true);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
      {/* Composer */}
      <div className="border-border bg-card flex min-w-0 flex-col rounded-xl border p-4 shadow-[0_24px_60px_-40px_oklch(0.2_0.01_260/0.35)] sm:p-6">
        <div className="flex items-center justify-between">
          <label
            htmlFor="halloween-prompt"
            className="font-display text-lg font-semibold tracking-tight"
          >
            {m['halloween.gen.prompt_label']()}
          </label>
          <button
            type="button"
            onClick={surprise}
            className="text-muted-foreground hover:text-foreground -my-2.5 inline-flex items-center gap-1.5 py-2.5 text-sm"
          >
            <Shuffle className="size-4" />
            {m['halloween.gen.surprise']()}
          </button>
        </div>

        <textarea
          id="halloween-prompt"
          ref={promptInput}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            usedPreset.current = '';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              generate.mutate();
            }
          }}
          maxLength={4000}
          rows={5}
          placeholder={m['halloween.gen.placeholder']()}
          className="border-input bg-background focus-visible:border-foreground/40 focus-visible:ring-ring/40 placeholder:text-muted-foreground/80 mt-4 min-h-32 w-full resize-y rounded-lg border px-4 py-3 text-[15px] leading-relaxed outline-none focus-visible:ring-2"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label={m['halloween.gen.ratio']()}
            className="border-border bg-background inline-flex h-11 items-center rounded-lg border p-1"
          >
            {RATIOS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={aspectRatio === r}
                onClick={() => setAspectRatio(r)}
                className={cn(
                  'h-full rounded-md px-3 font-mono text-[13px] transition-colors',
                  aspectRatio === r
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => generate.mutate()}
            disabled={!canGenerate}
            className="bg-primary text-primary-foreground ml-auto inline-flex h-11 items-center gap-2 rounded-lg px-5 font-medium whitespace-nowrap transition-[opacity,transform] hover:opacity-90 active:translate-y-px disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {m['halloween.gen.generate']()}
            <span className="bg-banana rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-[oklch(0.2_0.01_260)]">
              {showFree
                ? m['studio.free.badge']()
                : m['studio.credits_cost']({ credits: cost })}
            </span>
          </button>
        </div>

        {showFree && (
          <p className="text-muted-foreground mt-2 text-xs">
            {quota?.signedIn
              ? m['studio.free.note_user']()
              : m['studio.free.note_anon']()}
          </p>
        )}

        <div className="mt-auto pt-5">
          <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.12em] uppercase">
            {m['halloween.gen.presets']()}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {HALLOWEEN_PRESETS.map((preset) => {
              const label = PRESET_LABELS[preset.key]?.() ?? preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset.key, preset.prompt)}
                  title={label}
                  className="border-border hover:border-foreground/40 group relative overflow-hidden rounded-md border transition-colors"
                >
                  <img
                    src={preset.src}
                    alt={label}
                    loading="lazy"
                    width={192}
                    height={192}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="bg-background/85 absolute inset-x-0 bottom-0 truncate px-1 py-1 text-[10px] font-medium backdrop-blur-sm">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {m['halloween.gen.presets_hint']({
              prompt: HALLOWEEN_BASE_PROMPT,
            })}
          </p>
        </div>
      </div>

      {/* Output */}
      <div className="border-border bg-card relative flex min-h-[360px] min-w-0 flex-col rounded-xl border p-3 shadow-[0_24px_60px_-40px_oklch(0.2_0.01_260/0.35)] sm:p-4">
        <div className="flex items-center justify-between px-1 pb-3">
          <span className="text-muted-foreground font-mono text-xs tracking-[0.12em] uppercase">
            {result
              ? m['halloween.gen.output']()
              : m['halloween.gen.output_example']()}
          </span>
          {result && (
            <div className="flex gap-1.5">
              <a
                href={`/api/image/download?id=${result.id}`}
                aria-label={m['studio.download']()}
                title={m['studio.download']()}
                className="border-border hover:bg-accent rounded-md border p-2"
              >
                <Download className="size-4" />
              </a>
              <a
                href={result.imageUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={m['studio.open']()}
                title={m['studio.open']()}
                className="border-border hover:bg-accent rounded-md border p-2"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          )}
        </div>

        <div className="bg-muted relative flex flex-1 items-center justify-center overflow-hidden rounded-lg">
          {result ? (
            <img
              src={result.imageUrl}
              alt={result.prompt}
              style={{ aspectRatio: aspectRatio.replace(':', ' / ') }}
              className="max-h-[520px] w-auto max-w-full object-contain"
            />
          ) : (
            <img
              src={HALLOWEEN_PRESETS[0].src}
              alt={m['halloween.preset.ghost']()}
              loading="lazy"
              width={768}
              height={768}
              className="max-h-[520px] w-auto max-w-full object-contain"
            />
          )}

          {busy && (
            <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <div className="border-foreground/15 border-t-banana size-9 animate-spin rounded-full border-2" />
              <p className="text-sm font-medium">
                {m['halloween.gen.generating']()}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {m['studio.elapsed']({ seconds: elapsed })}
                {progress > 0 ? ` · ${progress}%` : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {paywallMounted && (
        <Suspense fallback={null}>
          <PaywallDialog open={paywall} onOpenChange={setPaywall} />
        </Suspense>
      )}
    </div>
  );
}
