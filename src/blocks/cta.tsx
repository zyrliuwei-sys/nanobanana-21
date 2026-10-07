import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { webpSrcSet } from '@/lib/img';
import { m } from '@/paraglide/messages.js';

const CTA_PRINTS = [
  '/imgs/generated/cta-1-ebd5e62e.jpg',
  '/imgs/generated/cta-2-c904889f.jpg',
  '/imgs/generated/cta-3-4e800c0d.jpg',
];

export function CTA() {
  return (
    <section className="px-4 pb-24">
      <div className="bg-card border-border relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-2xl border px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl leading-[1.08] font-semibold tracking-[-0.025em] text-balance sm:text-[2.6rem]">
            {m['landing.cta.headline']()}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {m['landing.cta.subheadline']()}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/#create"
              className="bg-primary text-primary-foreground inline-flex h-12 items-center gap-2 rounded-lg px-6 font-medium whitespace-nowrap transition-[opacity,transform] hover:opacity-90 active:translate-y-px"
            >
              {m['landing.cta.button']()}
              <ArrowRight className="size-4" />
            </Link>
            <span className="text-muted-foreground text-sm">
              {m['landing.cta.note']()}
            </span>
          </div>
        </div>
        <div aria-hidden className="hidden gap-3 lg:flex">
          {CTA_PRINTS.map((src, i) => (
            <img
              key={src}
              src={src}
              srcSet={webpSrcSet(src)}
              sizes="128px"
              alt=""
              loading="lazy"
              width={240}
              height={300}
              className={`frame aspect-[4/5] w-32 object-cover ${i === 1 ? '-translate-y-4' : 'translate-y-3'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
