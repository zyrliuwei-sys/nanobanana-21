import { webpSrcSet } from '@/lib/img';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders.
const COPY: Record<string, Record<string, () => string>> = {
  resolution: {
    title: () => m['landing.features.resolution.title'](),
    description: () => m['landing.features.resolution.description'](),
  },
  edit: {
    title: () => m['landing.features.edit.title'](),
    description: () => m['landing.features.edit.description'](),
  },
  product: {
    title: () => m['landing.features.product.title'](),
    description: () => m['landing.features.product.description'](),
  },
  text: {
    title: () => m['landing.features.text.title'](),
    description: () => m['landing.features.text.description'](),
  },
  fusion: {
    title: () => m['landing.features.fusion.title'](),
    description: () => m['landing.features.fusion.description'](),
  },
  character: {
    title: () => m['landing.features.character.title'](),
    description: () => m['landing.features.character.description'](),
  },
};
const copy = (key: string, field = 'text') => COPY[key]?.[field]?.() ?? '';

// Bento: one hero cell (4x2) and five supporting cells, exactly filling a
// 6-column grid at lg.
const CELLS = [
  {
    key: 'resolution',
    image: '/imgs/features/4k.jpg',
    className: 'sm:col-span-2 lg:col-span-4 lg:row-span-2',
    large: true,
  },
  {
    key: 'edit',
    image: '/imgs/features/edit.jpg',
    className: 'lg:col-span-2',
  },
  {
    key: 'product',
    image: '/imgs/features/product.jpg',
    className: 'lg:col-span-2',
  },
  { key: 'text', image: '/imgs/features/text.jpg', className: 'lg:col-span-2' },
  {
    key: 'fusion',
    image: '/imgs/features/fusion.jpg',
    className: 'lg:col-span-2',
  },
  {
    key: 'character',
    image: '/imgs/features/character.jpg',
    className: 'lg:col-span-2',
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="border-border bg-card/60 scroll-mt-20 border-t px-4 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading
            title={m['landing.features.title']()}
            description={m['landing.features.description']()}
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {CELLS.map(({ key, image, className, large }) => (
            <Reveal key={key} className={cn('flex', className)}>
              <article className="bg-background border-border group flex w-full flex-col overflow-hidden rounded-xl border">
                <div className="relative flex-1 overflow-hidden">
                  <img
                    src={image}
                    srcSet={webpSrcSet(image)}
                    sizes={
                      large
                        ? '(min-width: 1024px) 66vw, (min-width: 640px) 100vw, 100vw'
                        : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
                    }
                    alt={`Nano Banana 2.1 ${copy(key, 'title')}`}
                    loading="lazy"
                    width={800}
                    height={558}
                    className={cn(
                      'w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]',
                      large
                        ? 'aspect-[4/3] h-full lg:aspect-auto'
                        : 'aspect-[16/10]'
                    )}
                  />
                </div>
                <div className={cn('p-5', large && 'sm:p-7')}>
                  <h3
                    className={cn(
                      'font-display font-semibold tracking-tight',
                      large ? 'text-2xl' : 'text-lg'
                    )}
                  >
                    {copy(key, 'title')}
                  </h3>
                  <p
                    className={cn(
                      'text-muted-foreground mt-2 leading-relaxed',
                      large ? 'max-w-xl text-base' : 'text-sm'
                    )}
                  >
                    {copy(key, 'description')}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
