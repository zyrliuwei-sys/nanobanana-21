import { ImageUp, PenLine, WandSparkles } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders.
const COPY: Record<string, Record<string, () => string>> = {
  describe: {
    title: () => m['landing.how.describe.title'](),
    description: () => m['landing.how.describe.description'](),
  },
  reference: {
    title: () => m['landing.how.reference.title'](),
    description: () => m['landing.how.reference.description'](),
  },
  generate: {
    title: () => m['landing.how.generate.title'](),
    description: () => m['landing.how.generate.description'](),
  },
};
const copy = (key: string, field = 'text') => COPY[key]?.[field]?.() ?? '';

const STEPS = [
  { key: 'describe', icon: PenLine },
  { key: 'reference', icon: ImageUp },
  { key: 'generate', icon: WandSparkles },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how"
      className="border-border scroll-mt-20 border-t px-4 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading title={m['landing.how.title']()} />
        </Reveal>
        <Reveal className="relative mt-14">
          {/* Connector between the step icons (desktop). */}
          <div className="bg-border absolute top-6 right-[16%] left-[16%] hidden h-px md:block" />
          <ol className="grid gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ key, icon: Icon }) => (
              <li key={key} className="relative md:text-center">
                <div className="bg-background border-border relative inline-flex size-12 items-center justify-center rounded-full border">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold tracking-tight">
                  {copy(key, 'title')}
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed md:mx-auto md:max-w-xs">
                  {copy(key, 'description')}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
