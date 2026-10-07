import { Images, PenLine, Quote, Undo2 } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders.
const COPY: Record<string, Record<string, () => string>> = {
  t1: {
    title: () => m['landing.tips.t1.title'](),
    body: () => m['landing.tips.t1.body'](),
  },
  t2: {
    title: () => m['landing.tips.t2.title'](),
    body: () => m['landing.tips.t2.body'](),
  },
  t3: {
    title: () => m['landing.tips.t3.title'](),
    body: () => m['landing.tips.t3.body'](),
  },
  t4: {
    title: () => m['landing.tips.t4.title'](),
    body: () => m['landing.tips.t4.body'](),
  },
};
const copy = (key: string, field = 'text') => COPY[key]?.[field]?.() ?? '';

const TIPS = [
  { key: 't1', icon: PenLine },
  { key: 't2', icon: Quote },
  { key: 't3', icon: Images },
  { key: 't4', icon: Undo2 },
] as const;

export function Tips() {
  return (
    <section className="px-4 pb-20 sm:pb-28">
      <Reveal className="bg-accent mx-auto max-w-7xl rounded-2xl px-6 py-14 sm:px-12 sm:py-16">
        <SectionHeading
          eyebrow={m['landing.tips.eyebrow']()}
          title={m['landing.tips.title']()}
        />
        <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {TIPS.map(({ key, icon: Icon }) => (
            <div key={key} className="flex gap-4">
              <Icon
                className="text-foreground mt-1 size-5 shrink-0"
                strokeWidth={1.75}
              />
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {copy(key, 'title')}
                </h3>
                <p className="text-foreground/75 mt-1.5 leading-relaxed">
                  {copy(key, 'body')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
