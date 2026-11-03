import { ArrowUpRight, ChevronDown } from 'lucide-react';

import { webpSrcSet } from '@/lib/img';

export interface PromptPreset {
  id: string;
  title: string;
  description: string;
  prompt: string;
  image: string;
  imageSrcSet?: string;
  imagePosition?: string;
  aspectRatio: string;
}

export function PromptPresetGallery({
  presets,
  actionLabel,
  promptLabel,
  onSelect,
  disabled,
}: {
  presets: PromptPreset[];
  actionLabel: string;
  promptLabel: string;
  onSelect: (preset: PromptPreset) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:gap-y-12 md:grid-cols-12">
      {presets.map((preset, index) => (
        <article
          key={preset.id}
          className={`group flex min-w-0 flex-col ${index === 0 || index === 3 ? 'md:col-span-7' : 'md:col-span-5'}`}
        >
          <div className="bg-muted overflow-hidden rounded-xl">
            <img
              src={preset.image}
              srcSet={preset.imageSrcSet || webpSrcSet(preset.image)}
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 55vw, calc(100vw - 32px)"
              alt={preset.title}
              width={1600}
              height={900}
              loading="lazy"
              style={{ objectPosition: preset.imagePosition || 'center' }}
              className="aspect-video w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.025] md:aspect-auto md:h-64 lg:h-80"
            />
          </div>
          <h3 className="font-display mt-5 text-2xl font-semibold tracking-tight">
            {preset.title}
          </h3>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {preset.description}
          </p>
          <details className="border-border mt-4 border-t pt-1">
            <summary className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
              {promptLabel}
              <ChevronDown aria-hidden className="size-4" />
            </summary>
            <p className="text-muted-foreground pb-3 text-sm leading-7">
              {preset.prompt}
            </p>
          </details>
          <button
            type="button"
            onClick={() => onSelect(preset)}
            disabled={disabled}
            className="border-border hover:border-foreground focus-visible:ring-ring mt-1 flex min-h-11 items-center justify-between gap-2 border-b py-2 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-2 disabled:opacity-40"
          >
            {actionLabel}
            <ArrowUpRight aria-hidden className="size-4 shrink-0" />
          </button>
        </article>
      ))}
    </div>
  );
}
