import { SHOWCASE } from '@/config/showcase';
import { webpSrcSet } from '@/lib/img';
import { m } from '@/paraglide/messages.js';
import { Studio } from '@/blocks/studio';

// Three loose prints pinned beside the headline (real showcase images).
const PRINTS = [
  { item: SHOWCASE[3], className: 'top-6 left-0 -rotate-6' },
  { item: SHOWCASE[0], className: 'top-0 left-[30%] rotate-2 z-10' },
  { item: SHOWCASE[4], className: 'top-10 right-0 rotate-[7deg]' },
];

export function Hero() {
  const end = m['landing.hero.headline_end']();
  return (
    <section id="create" className="scroll-mt-20 px-4 pt-12 pb-20 sm:pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_400px]">
          <div className="max-w-3xl">
            <p className="text-banana-ink mb-5 font-mono text-xs font-medium tracking-[0.14em] uppercase">
              {m['landing.hero.eyebrow']()}
            </p>
            <h1 className="font-display text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.25rem]">
              {m['landing.hero.headline_start']()}{' '}
              <span className="marker whitespace-nowrap">
                {m['landing.hero.headline_accent']()}
              </span>
              {end ? ` ${end}` : null}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed text-pretty">
              {m['landing.hero.subheadline']()}
            </p>
          </div>

          <div aria-hidden className="relative hidden h-[250px] lg:block">
            {PRINTS.map(({ item, className }) => (
              <div
                key={item.key}
                className={`frame absolute w-[150px] ${className}`}
              >
                <img
                  src={item.src}
                  srcSet={webpSrcSet(item.src)}
                  sizes="150px"
                  alt=""
                  // Hidden below lg: lazy keeps mobile from downloading them.
                  loading="lazy"
                  width={300}
                  height={375}
                  className="aspect-[4/5] w-full rounded-[calc(var(--radius)-2px)] object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <Studio />
        </div>
      </div>
    </section>
  );
}
