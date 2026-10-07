import { SHOWCASE } from '@/config/showcase';
import { webpSrcSet } from '@/lib/img';
import { m } from '@/paraglide/messages.js';
import { loadPrompt } from '@/blocks/studio';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders.
const COPY: Record<string, Record<string, () => string>> = {
  portrait: { text: () => m['landing.showcase.portrait']() },
  product: { text: () => m['landing.showcase.product']() },
  fashion: { text: () => m['landing.showcase.fashion']() },
  food: { text: () => m['landing.showcase.food']() },
  anime: { text: () => m['landing.showcase.anime']() },
  architecture: { text: () => m['landing.showcase.architecture']() },
  landscape: { text: () => m['landing.showcase.landscape']() },
  character: { text: () => m['landing.showcase.character']() },
};
const copy = (key: string, field = 'text') => COPY[key]?.[field]?.() ?? '';

// Varied crops so the contact sheet reads as a masonry wall, not a grid.
const CROPS = [
  'aspect-[4/5]',
  'aspect-square',
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-square',
  'aspect-[4/5]',
];

export function Showcase() {
  return (
    <section id="showcase" className="scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading
            title={m['landing.showcase.title']()}
            description={m['landing.showcase.description']()}
          />
        </Reveal>
        <Reveal className="mt-12 columns-2 gap-4 sm:gap-5 lg:columns-4">
          {SHOWCASE.map((item, i) => (
            <figure key={item.key} className="mb-4 break-inside-avoid sm:mb-6">
              <button
                type="button"
                onClick={() => loadPrompt(item.prompt, item.aspectRatio)}
                aria-label={`${m['landing.showcase.try']()}: ${copy(item.key)}`}
                className="frame group block w-full cursor-pointer text-left transition-transform duration-500 hover:-translate-y-1"
              >
                <img
                  src={item.src}
                  srcSet={webpSrcSet(item.src)}
                  sizes="(min-width: 1024px) 300px, 50vw"
                  alt={`Nano Banana 2.1 prompt: ${item.prompt}`}
                  loading="lazy"
                  width={768}
                  height={893}
                  className={`${CROPS[i]} w-full rounded-[calc(var(--radius)-2px)] object-cover`}
                />
              </button>
              <figcaption className="mt-2.5 flex items-baseline justify-between gap-3 px-1">
                <span className="text-sm font-medium">{copy(item.key)}</span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {item.aspectRatio}
                </span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
