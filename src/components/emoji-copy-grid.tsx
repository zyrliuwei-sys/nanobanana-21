import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export type CopyableCategory = {
  key: string;
  label: string;
  emojis: string[];
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Non-secure context fallback: hidden textarea + execCommand.
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Click-to-copy emoji tiles grouped by category. Pure component — categories
 * and labels arrive via props; no i18n reads inside.
 */
export function EmojiCopyGrid({
  categories,
  copiedLabel,
}: {
  categories: CopyableCategory[];
  /** Announced to screen readers after a tile is copied. */
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => clearTimeout(timer.current!), []);

  async function copy(char: string) {
    if (!(await copyText(char))) return;
    setCopied(char);
    clearTimeout(timer.current!);
    timer.current = setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div className="flex flex-col gap-8">
      {categories.map((cat) => (
        <div key={cat.key}>
          <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.12em] uppercase">
            {cat.label}
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {cat.emojis.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => copy(char)}
                aria-label={`${char} copy`}
                className={cn(
                  'border-border bg-card hover:border-foreground/35 relative flex size-12 items-center justify-center rounded-lg border text-2xl transition-all select-none active:scale-95 sm:size-14 sm:text-3xl',
                  copied === char && 'border-transparent'
                )}
              >
                <span aria-hidden>{char}</span>
                {copied === char && (
                  <span className="bg-banana text-banana-ink absolute inset-0 flex items-center justify-center rounded-lg">
                    <Check className="size-5" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      <span aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
    </div>
  );
}

/** A full combo string (e.g. "🎃👻🍬🍭") that copies on click. */
export function ComboPill({
  emojis,
  label,
  copiedLabel,
}: {
  emojis: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => clearTimeout(timer.current!), []);

  async function copy() {
    if (!(await copyText(emojis))) return;
    setCopied(true);
    clearTimeout(timer.current!);
    timer.current = setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="border-border bg-card hover:border-foreground/35 inline-flex items-center gap-3 rounded-full border py-2.5 pr-4 pl-4 transition-colors active:scale-[0.98]"
    >
      <span className="text-xl tracking-wide select-none" aria-hidden>
        {emojis}
      </span>
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {label}
      </span>
      <span
        className={cn(
          'text-banana-ink bg-banana rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity',
          copied ? 'opacity-100' : 'opacity-0'
        )}
      >
        {copiedLabel}
      </span>
    </button>
  );
}
