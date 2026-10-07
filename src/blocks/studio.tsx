import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  Paperclip,
  Pencil,
  RectangleHorizontal,
  Shuffle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import {
  ASPECT_RATIOS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_CREDITS,
  DEFAULT_REFERENCE_CREDITS,
  DEFAULT_RESOLUTION,
  IMAGE_RESOLUTIONS,
  isAspectRatio,
  isImageResolution,
  MAX_REFERENCE_IMAGES,
  type AspectRatio,
  type ImageResolution,
} from '@/config/image-gen';
import { STUDIO_EXAMPLES, STUDIO_SAMPLE } from '@/config/showcase';
import { apiGet, apiPost, apiUpload } from '@/lib/api-client';
import { webpSrcSet } from '@/lib/img';
import { track } from '@/lib/track';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';

const PaywallDialog = lazy(() => import('@/blocks/paywall-dialog'));

const MODES = ['text', 'edit', 'fusion', 'product'] as const;
type Mode = (typeof MODES)[number];

const DRAFT_KEY = 'nb-draft';

type RefImage = {
  id: string;
  preview: string;
  url?: string;
  uploading: boolean;
};

type GenerateResult = {
  id: string;
  imageUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
};

/** /api/image/generate and /api/image/task response. */
type TaskView = {
  id: string;
  status: 'pending' | 'success' | 'failed';
  progress: number;
  imageUrl: string | null;
  prompt: string;
  aspectRatio: string | null;
  resolution: string | null;
};

// Survives a reload mid-generation (per tab).
const TASK_KEY = 'nb-task';
const POLL_MS = 2500;

const MODE_LABEL: Record<Mode, () => string> = {
  text: () => m['studio.mode.text'](),
  edit: () => m['studio.mode.edit'](),
  fusion: () => m['studio.mode.fusion'](),
  product: () => m['studio.mode.product'](),
};

const MODE_PLACEHOLDER: Record<Mode, () => string> = {
  text: () => m['studio.placeholder.text'](),
  edit: () => m['studio.placeholder.edit'](),
  fusion: () => m['studio.placeholder.fusion'](),
  product: () => m['studio.placeholder.product'](),
};

function errorText(message: string) {
  if (message === 'PROMPT_BLOCKED') return m['studio.error.blocked']();
  if (message === 'GENERATION_FAILED') return m['studio.error.failed']();
  if (message === 'STORAGE_REQUIRED') return m['studio.error.storage']();
  if (message === 'Generation is not configured') {
    return m['studio.error.not_configured']();
  }
  return message || m['studio.error.failed']();
}

const PROMPT_EVENT = 'nb:use-prompt';

/**
 * Load a prompt (and ratio) into the generator from anywhere on the page,
 * then scroll the generator into view.
 */
export function loadPrompt(prompt: string, aspectRatio?: string) {
  window.dispatchEvent(
    new CustomEvent(PROMPT_EVENT, { detail: { prompt, aspectRatio } })
  );
  document
    .getElementById('create')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Aspect ratio → CSS aspect-ratio value ("16:9" → "16 / 9"). */
const cssRatio = (r: string) => r.replace(':', ' / ');

export function Studio() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [mode, setMode] = useState<Mode>('text');
  const [prompt, setPrompt] = useState('');
  const [refs, setRefs] = useState<RefImage[]>([]);
  const [aspectRatio, setAspectRatio] =
    useState<AspectRatio>(DEFAULT_ASPECT_RATIO);
  const [resolution, setResolution] =
    useState<ImageResolution>(DEFAULT_RESOLUTION);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [paywallMounted, setPaywallMounted] = useState(false);
  if (paywall && !paywallMounted) setPaywallMounted(true);
  const [elapsed, setElapsed] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);

  const { data: priceData } = useQuery({
    queryKey: ['image-price'],
    queryFn: () =>
      apiGet<{
        credits: Record<ImageResolution, number>;
        referenceCredits: number;
      }>('/api/image/price'),
    staleTime: 10 * 60_000,
  });
  const prices = priceData?.credits ?? DEFAULT_IMAGE_CREDITS;
  const referenceCredits =
    priceData?.referenceCredits ?? DEFAULT_REFERENCE_CREDITS;
  const cost = prices[resolution] + referenceCredits * refs.length;

  // Resume a generation that was running before a reload.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TASK_KEY);
      if (saved) setTaskId(saved);
    } catch {
      // Storage unavailable.
    }
  }, []);

  function trackTask(id: string | null) {
    setTaskId(id);
    try {
      if (id) sessionStorage.setItem(TASK_KEY, id);
      else sessionStorage.removeItem(TASK_KEY);
    } catch {
      // Storage unavailable.
    }
  }

  // Poll the running task until it succeeds or fails.
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
    trackTask(null);
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    queryClient.invalidateQueries({ queryKey: ['image-history'] });
    if (task.status === 'success' && task.imageUrl) {
      setResult({
        id: task.id,
        imageUrl: task.imageUrl,
        prompt: task.prompt,
        aspectRatio: isAspectRatio(task.aspectRatio)
          ? task.aspectRatio
          : DEFAULT_ASPECT_RATIO,
        resolution: isImageResolution(task.resolution)
          ? task.resolution
          : DEFAULT_RESOLUTION,
      });
      track('image_generate_success', { resolution: task.resolution ?? '' });
    } else {
      toast.error(m['studio.error.failed']());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, taskId]);

  // A task that can't be found anymore (deleted / other account): stop.
  useEffect(() => {
    if (taskQuery.isError && taskId) trackTask(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskQuery.isError, taskId]);

  // Restore a draft saved before the sign-in round trip.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      localStorage.removeItem(DRAFT_KEY);
      const draft = JSON.parse(raw);
      if (typeof draft.prompt === 'string') setPrompt(draft.prompt);
      if (isAspectRatio(draft.aspectRatio)) setAspectRatio(draft.aspectRatio);
      if (isImageResolution(draft.resolution)) {
        setResolution(draft.resolution);
      }
      if (Array.isArray(draft.refs)) {
        setRefs(
          draft.refs
            .filter((u: unknown) => typeof u === 'string')
            .slice(0, MAX_REFERENCE_IMAGES)
            .map((url: string) => ({
              id: url,
              url,
              preview: url,
              uploading: false,
            }))
        );
      }
    } catch {
      // Storage unavailable or corrupt draft — start fresh.
    }
  }, []);

  useEffect(() => {
    function onPrompt(e: Event) {
      const { prompt: next, aspectRatio: ratio } = (e as CustomEvent).detail;
      setPrompt(next);
      if (isAspectRatio(ratio)) setAspectRatio(ratio);
      setTimeout(
        () => promptInput.current?.focus({ preventScroll: true }),
        400
      );
    }
    window.addEventListener(PROMPT_EVENT, onPrompt);
    return () => window.removeEventListener(PROMPT_EVENT, onPrompt);
  }, []);

  const generate = useMutation({
    mutationFn: () =>
      apiPost<TaskView>('/api/image/generate', {
        prompt: prompt.trim(),
        aspectRatio,
        resolution,
        images: refs.map((r) => r.url).filter(Boolean),
      }),
    onMutate: () => {
      setElapsed(0);
      track('image_generate_start', { resolution, refs: refs.length });
    },
    onSuccess: (data) => {
      // Credits are already reserved; the task finishes in the background.
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      trackTask(data.id);
    },
    onError: (e: Error) => {
      if (e.message === 'Insufficient credits') {
        track('image_paywall');
        setPaywall(true);
        return;
      }
      toast.error(errorText(e.message));
    },
  });

  const busy = generate.isPending || !!taskId;
  const progress = taskId ? (task?.progress ?? 0) : 0;

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  const uploading = refs.some((r) => r.uploading);
  const canGenerate = prompt.trim().length > 0 && !uploading && !busy;

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!session?.user) {
      goSignIn();
      return;
    }
    const room = MAX_REFERENCE_IMAGES - refs.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room) {
      toast.error(m['studio.error.too_many']({ max: MAX_REFERENCE_IMAGES }));
    }
    for (const file of picked) {
      const id = `${file.name}-${file.size}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      setRefs((prev) => [...prev, { id, preview, uploading: true }]);
      try {
        const form = new FormData();
        form.append('files', file);
        const data = await apiUpload<{ urls: string[] }>(
          '/api/storage/upload-image',
          form
        );
        setRefs((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, url: data.urls[0], uploading: false } : r
          )
        );
      } catch (e: any) {
        toast.error(e?.message || m['studio.error.upload']());
        setRefs((prev) => prev.filter((r) => r.id !== id));
      }
    }
    if (mode === 'text') setMode(picked.length > 1 ? 'fusion' : 'edit');
  }

  function goSignIn() {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          prompt,
          aspectRatio,
          resolution,
          refs: refs.map((r) => r.url).filter(Boolean),
        })
      );
    } catch {
      // Draft is a convenience only.
    }
    router.push(`/sign-in?callbackUrl=${encodeURIComponent('/#create')}`);
  }

  function handleGenerate() {
    if (!canGenerate) return;
    if (!session?.user) {
      goSignIn();
      return;
    }
    generate.mutate();
  }

  function applyExample(index: number) {
    const item = STUDIO_EXAMPLES[index];
    setPrompt(item.prompt);
    if (isAspectRatio(item.aspectRatio)) setAspectRatio(item.aspectRatio);
    promptInput.current?.focus();
  }

  function surprise() {
    const pick = Math.floor(Math.random() * STUDIO_EXAMPLES.length);
    applyExample(pick);
  }

  function editResult() {
    if (!result) return;
    if (refs.length >= MAX_REFERENCE_IMAGES) {
      toast.error(m['studio.error.too_many']({ max: MAX_REFERENCE_IMAGES }));
      return;
    }
    setRefs((prev) => [
      ...prev,
      {
        id: result.id,
        url: result.imageUrl,
        preview: result.imageUrl,
        uploading: false,
      },
    ]);
    setMode('edit');
    setPrompt('');
    promptInput.current?.focus();
  }

  const chip =
    'border-border bg-background hover:border-foreground/30 inline-flex h-11 items-center gap-2 rounded-lg border px-3.5 text-sm transition-colors disabled:opacity-50';

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_1fr]">
      {/* Composer */}
      <div className="border-border bg-card flex min-w-0 flex-col rounded-xl border shadow-[0_24px_60px_-40px_oklch(0.2_0.01_260/0.35)]">
        <div
          role="tablist"
          aria-label={m['studio.modes_label']()}
          className="border-border flex gap-1 overflow-x-auto border-b px-4 pt-3 sm:px-6"
        >
          {MODES.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={cn(
                'mr-3 -mb-px shrink-0 border-b-2 px-1 pb-3 text-sm whitespace-nowrap transition-colors sm:mr-4',
                mode === key
                  ? 'border-banana text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              )}
            >
              {MODE_LABEL[key]()}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <label
              htmlFor="studio-prompt"
              className="font-display text-lg font-semibold tracking-tight"
            >
              {m['studio.describe']()}
            </label>
            <button
              type="button"
              onClick={surprise}
              className="text-muted-foreground hover:text-foreground -my-2.5 inline-flex items-center gap-1.5 py-2.5 text-sm"
            >
              <Shuffle className="size-4" />
              {m['studio.surprise']()}
            </button>
          </div>

          <textarea
            id="studio-prompt"
            ref={promptInput}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleGenerate();
              }
            }}
            maxLength={4000}
            rows={4}
            placeholder={MODE_PLACEHOLDER[mode]()}
            className="border-input bg-background focus-visible:border-foreground/40 focus-visible:ring-ring/40 placeholder:text-muted-foreground/80 min-h-28 w-full resize-y rounded-lg border px-4 py-3 text-[15px] leading-relaxed outline-none focus-visible:ring-2"
          />

          {refs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {refs.map((r) => (
                <div
                  key={r.id}
                  className="border-border relative size-16 overflow-hidden rounded-md border"
                >
                  <img
                    src={r.preview}
                    alt=""
                    className={cn(
                      'size-full object-cover',
                      r.uploading && 'opacity-40'
                    )}
                  />
                  {r.uploading ? (
                    <Loader2 className="absolute inset-0 m-auto size-5 animate-spin" />
                  ) : (
                    <button
                      type="button"
                      aria-label={m['studio.remove_image']()}
                      onClick={() =>
                        setRefs((prev) => prev.filter((x) => x.id !== r.id))
                      }
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className={chip}
              onClick={() => fileInput.current?.click()}
              disabled={refs.length >= MAX_REFERENCE_IMAGES}
            >
              <Paperclip className="size-4" />
              {refs.length
                ? m['studio.images_count']({
                    count: refs.length,
                    max: MAX_REFERENCE_IMAGES,
                  })
                : m['studio.add_image']()}
            </button>

            <label className={cn(chip, 'relative pr-3')}>
              <RectangleHorizontal className="size-4" />
              <span className="sr-only">{m['studio.aspect_ratio']()}</span>
              <select
                value={aspectRatio}
                onChange={(e) =>
                  isAspectRatio(e.target.value) &&
                  setAspectRatio(e.target.value)
                }
                className="bg-transparent font-mono text-[13px] outline-none"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r} className="bg-card">
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <div
              role="radiogroup"
              aria-label={m['studio.resolution']()}
              className="border-border bg-background inline-flex h-11 items-center rounded-lg border p-1"
            >
              {IMAGE_RESOLUTIONS.map((res) => (
                <button
                  key={res}
                  type="button"
                  role="radio"
                  aria-checked={resolution === res}
                  onClick={() => setResolution(res)}
                  className={cn(
                    'h-full min-w-10 rounded-md px-3 font-mono text-[13px] transition-colors',
                    resolution === res
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {res}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="bg-primary text-primary-foreground ml-auto inline-flex h-11 items-center gap-2 rounded-lg px-5 font-medium whitespace-nowrap transition-[opacity,transform] hover:opacity-90 active:translate-y-px disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {m['studio.generate']()}
              <span className="bg-banana rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-[oklch(0.2_0.01_260)]">
                {m['studio.credits_cost']({ credits: cost })}
              </span>
            </button>
          </div>

          <div className="mt-auto pt-4">
            <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.12em] uppercase">
              {m['studio.examples']()}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {STUDIO_EXAMPLES.map((item, i) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => applyExample(i)}
                  title={item.prompt}
                  className="border-border hover:border-foreground/40 group overflow-hidden rounded-md border transition-colors"
                >
                  <img
                    src={item.src}
                    srcSet={webpSrcSet(item.src)}
                    sizes="(min-width: 1024px) 120px, 25vw"
                    alt={item.prompt}
                    loading="lazy"
                    width={192}
                    height={240}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="border-border bg-card relative flex min-h-[360px] min-w-0 flex-col rounded-xl border p-3 shadow-[0_24px_60px_-40px_oklch(0.2_0.01_260/0.35)] sm:p-4">
        <div className="flex items-center justify-between px-1 pb-3">
          <span className="text-muted-foreground font-mono text-xs tracking-[0.12em] uppercase">
            {result ? m['studio.output']() : m['studio.output_example']()}
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
              <button
                type="button"
                onClick={editResult}
                className="border-border hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-3 text-sm"
              >
                <Pencil className="size-3.5" />
                {m['studio.edit_this']()}
              </button>
            </div>
          )}
        </div>

        <div className="bg-muted relative flex flex-1 items-center justify-center overflow-hidden rounded-lg">
          {result ? (
            <img
              src={result.imageUrl}
              alt={result.prompt}
              style={{ aspectRatio: cssRatio(result.aspectRatio) }}
              className="max-h-[600px] w-auto max-w-full object-contain"
            />
          ) : (
            <img
              src={STUDIO_SAMPLE.src}
              // Desktop LCP element.
              fetchPriority="high"
              srcSet={webpSrcSet(STUDIO_SAMPLE.src)}
              sizes="(min-width: 1024px) 560px, 100vw"
              alt={STUDIO_SAMPLE.prompt}
              width={768}
              height={960}
              className="max-h-[600px] w-auto max-w-full object-contain"
            />
          )}

          {busy && (
            <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <div className="border-foreground/15 border-t-banana size-9 animate-spin rounded-full border-2" />
              <p className="text-sm font-medium">{m['studio.generating']()}</p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {m['studio.elapsed']({ seconds: elapsed })}
                {progress > 0 ? ` · ${progress}%` : ''}
              </p>
            </div>
          )}
        </div>

        {!result && !busy && (
          <p className="text-muted-foreground mt-3 flex items-center gap-2 px-1 text-xs">
            <ImagePlus className="size-3.5" />
            {m['studio.output_hint']()}
          </p>
        )}
      </div>

      {paywallMounted && (
        <Suspense fallback={null}>
          <PaywallDialog open={paywall} onOpenChange={setPaywall} />
        </Suspense>
      )}
    </div>
  );
}
