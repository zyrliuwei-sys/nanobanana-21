import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Download,
  ExternalLink,
  Loader2,
  RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { MAX_PROMPT_LENGTH } from '@/config/image-gen';
import {
  isSeedreamRatio,
  SEEDREAM_ENGINE,
  SEEDREAM_RATIOS,
  SEEDREAM_RESOLUTION,
} from '@/config/seedream';
import { SEEDREAM_IMAGES } from '@/config/seedream-gallery';
import { apiGet, apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import {
  PromptPresetGallery,
  type PromptPreset,
} from '@/components/prompt-preset-gallery';

type TaskView = {
  id: string;
  status: 'pending' | 'success' | 'failed';
  progress: number;
  imageUrl: string | null;
  prompt: string;
  aspectRatio: string | null;
};

function presets(): PromptPreset[] {
  return [
    {
      id: 'landscape',
      title: m['seedream.prompt.landscape.title'](),
      description: m['seedream.prompt.landscape.detail'](),
      prompt: m['seedream.prompt.landscape.text'](),
      image: SEEDREAM_IMAGES.landscape.src,
      imageSrcSet: SEEDREAM_IMAGES.landscape.srcSet,
      imagePosition: 'center top',
      aspectRatio: '16:9',
    },
    {
      id: 'architecture',
      title: m['seedream.prompt.architecture.title'](),
      description: m['seedream.prompt.architecture.detail'](),
      prompt: m['seedream.prompt.architecture.text'](),
      image: SEEDREAM_IMAGES.architecture.src,
      imageSrcSet: SEEDREAM_IMAGES.architecture.srcSet,
      aspectRatio: '16:9',
    },
    {
      id: 'product',
      title: m['seedream.prompt.product.title'](),
      description: m['seedream.prompt.product.detail'](),
      prompt: m['seedream.prompt.product.text'](),
      image: SEEDREAM_IMAGES.product.src,
      imageSrcSet: SEEDREAM_IMAGES.product.srcSet,
      aspectRatio: '16:9',
    },
    {
      id: 'portrait',
      title: m['seedream.prompt.portrait.title'](),
      description: m['seedream.prompt.portrait.detail'](),
      prompt: m['seedream.prompt.portrait.text'](),
      image: SEEDREAM_IMAGES.portrait.src,
      imageSrcSet: SEEDREAM_IMAGES.portrait.srcSet,
      aspectRatio: '16:9',
    },
  ];
}

export function SeedreamGenerator() {
  const { data: session, isPending: sessionPending } = useSession();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  // Auth and query caches can already be populated in the browser. Keep
  // the initial render identical to SSR before displaying cached data.
  const user = hydrated ? session?.user : null;
  const authPending = !hydrated || sessionPending;
  const queryClient = useQueryClient();
  const examples = presets();
  const [reference, setReference] = useState(examples[0]);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<TaskView | null>(null);
  const [error, setError] = useState('');
  const [needsCredits, setNeedsCredits] = useState(false);

  const price = useQuery({
    queryKey: ['image-price'],
    queryFn: () => apiGet<{ seedreamCredits: number }>('/api/image/price'),
    staleTime: 60_000,
  });
  const cost = price.data?.seedreamCredits;
  const priceReady = hydrated && typeof cost === 'number' && cost > 0;

  const taskQuery = useQuery({
    queryKey: ['image-task', taskId],
    queryFn: () =>
      apiGet<TaskView>(`/api/image/task?id=${encodeURIComponent(taskId!)}`),
    enabled: !!taskId,
    refetchInterval: (q) =>
      q.state.error || (q.state.data && q.state.data.status !== 'pending')
        ? false
        : 2500,
    retry: 3,
  });

  useEffect(() => {
    const task = taskQuery.data;
    if (!taskId || task?.id !== taskId || task.status === 'pending') return;
    setTaskId(null);
    void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    void queryClient.invalidateQueries({ queryKey: ['image-history'] });
    if (task.status === 'success' && task.imageUrl) {
      setResult(task);
      toast.success(m['seedream.gen.success']());
    } else {
      setError(m['seedream.gen.failed']());
    }
  }, [taskQuery.data, taskId, queryClient]);

  const generate = useMutation({
    mutationFn: (value: { prompt: string; aspectRatio: string }) =>
      apiPost<TaskView>('/api/image/generate', {
        engine: SEEDREAM_ENGINE,
        prompt: value.prompt.trim(),
        aspectRatio: value.aspectRatio,
        resolution: SEEDREAM_RESOLUTION,
      }),
    onMutate: () => {
      setError('');
      setNeedsCredits(false);
    },
    onSuccess: (data) => {
      setTaskId(data.id);
      void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (e: Error) => {
      if (e.message === 'Insufficient credits') {
        setNeedsCredits(true);
        setError(m['seedream.gen.credits_error']());
      } else if (e.message === 'Generation is not configured') {
        setError(m['studio.error.not_configured']());
      } else if (e.message === 'PROMPT_BLOCKED') {
        setError(m['studio.error.blocked']());
      } else if (e.message === 'Unauthorized') {
        setError(m['seedream.gen.auth_note']());
        void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      } else {
        setError(m['seedream.gen.submit_error']());
      }
    },
  });
  const busy = generate.isPending || !!taskId;

  const form = useForm({
    defaultValues: { prompt: examples[0].prompt, aspectRatio: '16:9' },
    validators: {
      onSubmit: z.object({
        prompt: z
          .string()
          .trim()
          .min(1, m['seedream.gen.required']())
          .max(MAX_PROMPT_LENGTH),
        aspectRatio: z.string().refine(isSeedreamRatio),
      }),
    },
    onSubmit: async ({ value }) => {
      if (busy || !user || !priceReady) return;
      await generate.mutateAsync(value).catch(() => undefined);
    },
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('seedream-prompt-draft');
      if (!saved) return;
      const draft: unknown = JSON.parse(saved);
      if (
        draft &&
        typeof draft === 'object' &&
        'prompt' in draft &&
        'aspectRatio' in draft &&
        typeof draft.prompt === 'string' &&
        draft.prompt.length <= MAX_PROMPT_LENGTH &&
        isSeedreamRatio(draft.aspectRatio)
      ) {
        form.setFieldValue('prompt', draft.prompt);
        form.setFieldValue('aspectRatio', draft.aspectRatio);
      }
      sessionStorage.removeItem('seedream-prompt-draft');
    } catch {
      // The generator remains usable when browser storage is unavailable.
    }
  }, [form]);

  function applyPreset(preset: PromptPreset) {
    setReference(preset);
    form.setFieldValue('prompt', preset.prompt);
    form.setFieldValue('aspectRatio', preset.aspectRatio);
    document.getElementById('generator')?.scrollIntoView({ block: 'start' });
    promptRef.current?.focus({ preventScroll: true });
    toast.success(m['seedream.prompts.applied']());
  }

  return (
    <>
      <section
        id="generator"
        aria-labelledby="seedream-generator-title"
        className="scroll-mt-24 px-4 pb-16 sm:pb-24"
      >
        <div className="border-border bg-card mx-auto max-w-7xl overflow-hidden rounded-2xl border">
          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
            <h2
              id="seedream-generator-title"
              className="font-display text-base font-semibold"
            >
              {m['seedream.gen.title']()}
            </h2>
            <span className="text-muted-foreground font-mono text-xs">
              {m['seedream.gen.model']()} / 2K
            </span>
          </div>
          <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
              }}
              className="lg:border-border flex min-w-0 flex-col p-5 sm:p-6 lg:border-r"
            >
              <form.Field name="prompt">
                {(field) => (
                  <div>
                    <label
                      htmlFor="seedream-prompt"
                      className="text-sm font-medium"
                    >
                      {m['seedream.gen.prompt_label']()}
                    </label>
                    <textarea
                      ref={promptRef}
                      id="seedream-prompt"
                      name={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          (event.ctrlKey || event.metaKey)
                        ) {
                          event.preventDefault();
                          void form.handleSubmit();
                        }
                      }}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length
                          ? 'seedream-prompt-error'
                          : undefined
                      }
                      maxLength={MAX_PROMPT_LENGTH}
                      disabled={busy}
                      rows={6}
                      placeholder={m['seedream.gen.placeholder']()}
                      className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring mt-3 min-h-44 w-full resize-y rounded-lg border p-3 text-sm leading-6 outline-none focus-visible:ring-2 disabled:opacity-65"
                    />
                    <div className="text-muted-foreground mt-1 flex justify-end text-xs tabular-nums">
                      {field.state.value.length}/{MAX_PROMPT_LENGTH}
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p
                        id="seedream-prompt-error"
                        role="alert"
                        className="text-destructive mt-2 text-sm"
                      >
                        {m['seedream.gen.required']()}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="aspectRatio">
                {(field) => (
                  <fieldset disabled={busy} className="mt-4">
                    <legend className="mb-2 text-sm font-medium">
                      {m['seedream.gen.ratio']()}
                    </legend>
                    <div className="grid grid-cols-5 gap-2">
                      {SEEDREAM_RATIOS.map((ratio) => {
                        const [width, height] = ratio.split(':').map(Number);
                        return (
                          <label
                            key={ratio}
                            className={cn(
                              'has-focus-visible:ring-ring relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border py-2 font-mono text-xs transition-colors has-focus-visible:ring-2',
                              field.state.value === ratio
                                ? 'border-foreground bg-accent'
                                : 'border-border hover:bg-muted',
                              busy && 'cursor-default opacity-65'
                            )}
                          >
                            <input
                              type="radio"
                              name="seedream-ratio"
                              value={ratio}
                              checked={field.state.value === ratio}
                              onChange={() => field.handleChange(ratio)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden
                              className="block rounded-[2px] border border-current"
                              style={{
                                width:
                                  width >= height ? 19 : (19 * width) / height,
                                height:
                                  height >= width ? 19 : (19 * height) / width,
                              }}
                            />
                            {ratio}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
              </form.Field>
              <div className="mt-auto pt-5">
                <div className="text-muted-foreground mb-3 flex min-h-5 items-center justify-between gap-3 text-xs">
                  <span>{m['seedream.gen.model']()}</span>
                  <span className="font-mono">
                    {priceReady
                      ? m['studio.credits_cost']({ credits: cost })
                      : m['seedream.gen.price_loading']()}
                  </span>
                </div>
                {authPending || user ? (
                  <button
                    type="submit"
                    disabled={busy || authPending || !priceReady}
                    className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 font-medium whitespace-nowrap transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    {busy || authPending ? (
                      <Loader2 aria-hidden className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight aria-hidden className="size-4" />
                    )}
                    {busy
                      ? m['seedream.gen.generating']()
                      : m['seedream.gen.generate']()}
                  </button>
                ) : (
                  <Link
                    href="/sign-in?callbackUrl=%2Fseedream-5-0%23generator"
                    onClick={() => {
                      try {
                        sessionStorage.setItem(
                          'seedream-prompt-draft',
                          JSON.stringify(form.state.values)
                        );
                      } catch {
                        // Browser storage is optional.
                      }
                    }}
                    className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 font-medium whitespace-nowrap hover:opacity-90 focus-visible:ring-2"
                  >
                    {m['seedream.gen.sign_in']()}
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                )}
                <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                  {user
                    ? m['seedream.gen.refund_note']()
                    : m['seedream.gen.auth_note']()}
                </p>
                {price.isError && (
                  <div role="alert" className="text-destructive mt-3 text-sm">
                    {m['seedream.gen.price_error']()}{' '}
                    <button
                      type="button"
                      onClick={() => void price.refetch()}
                      className="min-h-10 underline underline-offset-4"
                    >
                      {m['seedream.gen.retry']()}
                    </button>
                  </div>
                )}
                {error && (
                  <div
                    role="alert"
                    className="border-destructive/25 bg-destructive/5 mt-4 rounded-lg border p-3 text-sm leading-relaxed"
                  >
                    <p>{error}</p>
                    {needsCredits && (
                      <Link
                        href="/pricing"
                        className="mt-2 inline-flex min-h-10 items-center gap-2 font-medium underline underline-offset-4"
                      >
                        {m['seedream.gen.get_credits']()}
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </form>
            <div
              className="border-border bg-muted/30 flex min-w-0 flex-col border-t p-4 sm:p-5 lg:border-t-0"
              aria-busy={busy}
            >
              <div className="mb-3 flex min-h-9 items-center justify-between gap-3 px-1">
                <p className="text-sm font-medium">
                  {result
                    ? m['seedream.gen.output']()
                    : m['seedream.gen.preview']()}
                </p>
                {result ? (
                  <div className="flex gap-2">
                    <a
                      href={`/api/image/download?id=${encodeURIComponent(result.id)}`}
                      aria-label={m['seedream.gen.download']()}
                      title={m['seedream.gen.download']()}
                      className="border-border bg-card hover:bg-accent rounded-md border p-2.5"
                    >
                      <Download aria-hidden className="size-4" />
                    </a>
                    <a
                      href={result.imageUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={m['seedream.gen.open']()}
                      title={m['seedream.gen.open']()}
                      className="border-border bg-card hover:bg-accent rounded-md border p-2.5"
                    >
                      <ExternalLink aria-hidden className="size-4" />
                    </a>
                  </div>
                ) : (
                  <Link
                    href="/settings/images"
                    className="text-muted-foreground hover:text-foreground inline-flex min-h-10 items-center gap-1.5 text-xs"
                  >
                    {m['seedream.gen.history']()}
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
              </div>
              <div className="bg-muted relative flex aspect-video min-h-56 w-full items-center justify-center overflow-hidden rounded-lg sm:min-h-80">
                <img
                  src={result?.imageUrl || reference.image}
                  srcSet={result ? undefined : reference.imageSrcSet}
                  sizes={
                    result
                      ? undefined
                      : '(min-width: 1280px) 860px, (min-width: 1024px) 65vw, calc(100vw - 72px)'
                  }
                  alt={
                    result
                      ? m['seedream.gen.result_alt']({ prompt: result.prompt })
                      : reference.title
                  }
                  width={1600}
                  height={900}
                  fetchPriority={result ? 'auto' : 'high'}
                  className={cn(
                    'absolute inset-0 size-full',
                    result ? 'object-contain' : 'object-cover'
                  )}
                />
                {busy && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="bg-background/90 absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center backdrop-blur-sm"
                  >
                    <Loader2 aria-hidden className="size-7 animate-spin" />
                    <p className="font-display text-lg font-semibold">
                      {m['seedream.gen.generating']()}
                    </p>
                    {taskQuery.isError ? (
                      <>
                        <p className="text-muted-foreground max-w-xs text-sm">
                          {m['seedream.gen.poll_error']()}
                        </p>
                        <button
                          type="button"
                          onClick={() => void taskQuery.refetch()}
                          className="border-border bg-card inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm"
                        >
                          <RotateCw aria-hidden className="size-4" />
                          {m['seedream.gen.retry']()}
                        </button>
                      </>
                    ) : (
                      <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                        {m['seedream.gen.generating_hint']()}
                        {taskQuery.data?.progress
                          ? ` (${taskQuery.data.progress}%)`
                          : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mt-3 px-1 text-xs leading-relaxed">
                {result
                  ? m['seedream.gen.refund_note']()
                  : m['seedream.gen.preview_note']()}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        id="prompts"
        aria-labelledby="seedream-prompts-title"
        className="border-border scroll-mt-24 border-t px-4 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <h2
            id="seedream-prompts-title"
            className="font-display max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
          >
            {m['seedream.prompts.title']()}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
            {m['seedream.prompts.description']()}
          </p>
          <div className="mt-10">
            <PromptPresetGallery
              presets={examples}
              actionLabel={m['seedream.prompts.use']()}
              promptLabel={m['seedream.prompts.view']()}
              onSelect={applyPreset}
              disabled={busy}
            />
          </div>
          <p className="text-muted-foreground mt-6 text-xs leading-relaxed">
            {m['seedream.prompts.note']()}
          </p>
        </div>
      </section>
    </>
  );
}
