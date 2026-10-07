import { webpSrcSet } from '@/lib/img';
import { m } from '@/paraglide/messages.js';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders.
const COPY: Record<string, Record<string, () => string>> = {
  ecommerce: {
    label: () => m['landing.use_cases.ecommerce.label'](),
    title: () => m['landing.use_cases.ecommerce.title'](),
    body: () => m['landing.use_cases.ecommerce.body'](),
  },
  social: {
    label: () => m['landing.use_cases.social.label'](),
    title: () => m['landing.use_cases.social.title'](),
    body: () => m['landing.use_cases.social.body'](),
  },
  marketing: {
    label: () => m['landing.use_cases.marketing.label'](),
    title: () => m['landing.use_cases.marketing.title'](),
    body: () => m['landing.use_cases.marketing.body'](),
  },
  design: {
    label: () => m['landing.use_cases.design.label'](),
    title: () => m['landing.use_cases.design.title'](),
    body: () => m['landing.use_cases.design.body'](),
  },
};
const copy = (key: string, field = 'text') => COPY[key]?.[field]?.() ?? '';

const CASES = [
  { key: 'ecommerce', image: '/imgs/generated/usecase-ecommerce.jpg' },
  { key: 'social', image: '/imgs/generated/usecase-social.jpg' },
  { key: 'marketing', image: '/imgs/generated/usecase-marketing.jpg' },
  { key: 'design', image: '/imgs/generated/usecase-design.jpg' },
] as const;

export function UseCases() {
  return (
    <section className="border-border border-t px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading title={m['landing.use_cases.title']()} />
        </Reveal>
        <div className="divide-border mt-12 divide-y">
          {CASES.map(({ key, image }) => (
            <Reveal key={key}>
              <div className="grid items-center gap-5 py-7 sm:grid-cols-[140px_1fr_112px] sm:gap-10">
                <p className="text-banana-ink font-mono text-xs font-medium tracking-[0.14em] uppercase">
                  {copy(key, 'label')}
                </p>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    {copy(key, 'title')}
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                    {copy(key, 'body')}
                  </p>
                </div>
                <img
                  src={image}
                  srcSet={webpSrcSet(image)}
                  sizes="112px"
                  alt=""
                  loading="lazy"
                  width={224}
                  height={224}
                  className="hidden aspect-square w-28 rounded-lg object-cover sm:block"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
