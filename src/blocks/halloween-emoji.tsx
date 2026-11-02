import { ArrowDown, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  HALLOWEEN_COMBOS,
  HALLOWEEN_EMOJI_CATEGORIES,
  HALLOWEEN_KAOMOJI,
  HALLOWEEN_MEANINGS,
} from '@/config/halloween-emoji';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { ComboPill, EmojiCopyGrid } from '@/components/emoji-copy-grid';
import { SectionHeading } from '@/components/section-heading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { buttonVariants } from '@/components/ui/button';

const TICKER = '🎃 👻 💀 ☠️ 🦇 🕷️ 🕸️ 🧙‍♀️ 🧛 🧟 🐈‍⬛ 🌕 🍬 🕯️ 🏚️';

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders — same convention as blocks/faq.tsx and the other
// landing blocks.
const CATEGORY_LABELS: Record<string, () => string> = {
  pumpkins: () => m['halloween.cat.pumpkins'](),
  ghosts: () => m['halloween.cat.ghosts'](),
  skulls: () => m['halloween.cat.skulls'](),
  monsters: () => m['halloween.cat.monsters'](),
  witches: () => m['halloween.cat.witches'](),
  critters: () => m['halloween.cat.critters'](),
  candy: () => m['halloween.cat.candy'](),
  faces: () => m['halloween.cat.faces'](),
  night: () => m['halloween.cat.night'](),
  party: () => m['halloween.cat.party'](),
};

const COMBO_LABELS: Record<string, () => string> = {
  trick_or_treat: () => m['halloween.combo.trick_or_treat'](),
  spooky_night: () => m['halloween.combo.spooky_night'](),
  web: () => m['halloween.combo.web'](),
  witchy: () => m['halloween.combo.witchy'](),
  haunted: () => m['halloween.combo.haunted'](),
  cute_spooky: () => m['halloween.combo.cute_spooky'](),
};

const MEANING_LABELS: Record<string, () => string> = {
  pumpkin: () => m['halloween.meaning.pumpkin'](),
  ghost: () => m['halloween.meaning.ghost'](),
  skull: () => m['halloween.meaning.skull'](),
  zombie: () => m['halloween.meaning.zombie'](),
  vampire: () => m['halloween.meaning.vampire'](),
  witch: () => m['halloween.meaning.witch'](),
  bat: () => m['halloween.meaning.bat'](),
  spider: () => m['halloween.meaning.spider'](),
  web: () => m['halloween.meaning.web'](),
  cat: () => m['halloween.meaning.cat'](),
  moon: () => m['halloween.meaning.moon'](),
  candles: () => m['halloween.meaning.candles'](),
};

export function HalloweenHero() {
  return (
    <section className="px-4 pt-12 pb-14 sm:pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-banana-ink mb-5 font-mono text-xs font-medium tracking-[0.14em] uppercase">
            {m['halloween.hero.eyebrow']()}
          </p>
          <h1 className="font-display text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.25rem]">
            {m['halloween.hero.title']()}{' '}
            <span className="marker whitespace-nowrap">
              {m['halloween.hero.accent']()}
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
            {m['halloween.hero.sub']()}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#generator" className={cn(buttonVariants(), 'gap-1.5')}>
              <Sparkles className="size-4" />
              {m['halloween.hero.cta_generate']()}
            </a>
            <a
              href="#emojis"
              className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}
            >
              {m['halloween.hero.cta_copy']()}
              <ArrowDown className="size-4" />
            </a>
          </div>
        </div>
        <p
          aria-hidden
          className="text-muted-foreground/70 mt-10 text-center text-2xl tracking-[0.2em] select-none sm:text-3xl"
        >
          {TICKER}
        </p>
      </div>
    </section>
  );
}

export function HalloweenCopySection() {
  return (
    <section
      id="emojis"
      className="border-border scroll-mt-20 border-t px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title={m['halloween.copy.title']()}
          accent={m['halloween.copy.accent']()}
          description={m['halloween.copy.description']()}
        />
        <div className="mt-10">
          <EmojiCopyGrid
            categories={HALLOWEEN_EMOJI_CATEGORIES.map((cat) => ({
              key: cat.key,
              label: CATEGORY_LABELS[cat.key]?.() ?? cat.key,
              emojis: cat.emojis,
            }))}
            copiedLabel={m['halloween.copy.copied']()}
          />
        </div>

        <div className="mt-14">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            {m['halloween.copy.combos_title']()}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-2xl text-[15px] leading-relaxed">
            {m['halloween.copy.combos_hint']()}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {HALLOWEEN_COMBOS.map((combo) => (
              <ComboPill
                key={combo.key}
                emojis={combo.emojis}
                label={COMBO_LABELS[combo.key]?.() ?? combo.key}
                copiedLabel={m['halloween.copy.copied']()}
              />
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            {m['halloween.copy.kaomoji_title']()}
          </h3>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {HALLOWEEN_KAOMOJI.map((face) => (
              <ComboPill
                key={face}
                emojis={face}
                label=""
                copiedLabel={m['halloween.copy.copied']()}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HalloweenContent() {
  return (
    <>
      <section className="border-border border-t px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title={m['halloween.content.what.title']()}
            description={m['halloween.content.what.p1']()}
          />
          <p className="text-muted-foreground mt-5 max-w-3xl text-base leading-relaxed">
            {m['halloween.content.what.p2']()}
          </p>
        </div>
      </section>

      <section className="border-border border-t px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title={m['halloween.content.meanings.title']()}
            description={m['halloween.content.meanings.intro']()}
          />
          <dl className="mt-10 grid gap-x-12 gap-y-7 sm:grid-cols-2">
            {HALLOWEEN_MEANINGS.map(({ key, emoji }) => (
              <div key={key} className="flex gap-4">
                <dt className="border-border bg-card flex size-12 shrink-0 items-center justify-center rounded-lg border text-2xl">
                  <span aria-hidden>{emoji}</span>
                  <span className="sr-only">{emoji}</span>
                </dt>
                <dd className="text-muted-foreground text-[15px] leading-relaxed">
                  {MEANING_LABELS[key]?.() ?? key}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-border border-t px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title={m['halloween.content.use.title']()}
            description={m['halloween.content.use.intro']()}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(['instagram', 'whatsapp', 'discord', 'invites'] as const).map(
              (key) => (
                <div
                  key={key}
                  className="border-border bg-card rounded-xl border p-5"
                >
                  <p className="font-display font-semibold tracking-tight">
                    {m[`halloween.content.use.${key}.title`]()
                      .replace(/[—–]/g, '')
                      .trim()}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {m[`halloween.content.use.${key}.body`]()}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="border-border border-t px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title={m['halloween.content.how.title']()}
            description={m['halloween.content.how.intro']()}
          />
          <ol className="mt-10 grid max-w-5xl gap-8 sm:grid-cols-3">
            {(['describe', 'generate', 'share'] as const).map((key, i) => (
              <li key={key}>
                <p className="text-banana-ink font-mono text-xs font-medium tracking-[0.14em] uppercase">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="font-display mt-2 text-lg font-semibold tracking-tight">
                  {m[`halloween.content.how.${key}.title`]()}
                </h3>
                <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">
                  {m[`halloween.content.how.${key}.body`]()}
                </p>
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground mt-10 text-sm">
            {m['halloween.content.how.footer']()}{' '}
            <Link href="/#create" className="underline underline-offset-4">
              {m['halloween.content.how.footer_link']()}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

// Static message lookups (not tDynamic) so the FAQPage JSON-LD in the route
// resolves without bundling every message.
const FAQ_COPY: Record<string, Record<string, () => string>> = {
  official: {
    question: () => m['halloween.faq.official.q'](),
    answer: () => m['halloween.faq.official.a'](),
  },
  copy: {
    question: () => m['halloween.faq.copy.q'](),
    answer: () => m['halloween.faq.copy.a'](),
  },
  popular: {
    question: () => m['halloween.faq.popular.q'](),
    answer: () => m['halloween.faq.popular.a'](),
  },
  free: {
    question: () => m['halloween.faq.free.q'](),
    answer: () => m['halloween.faq.free.a'](),
  },
  commercial: {
    question: () => m['halloween.faq.commercial.q'](),
    answer: () => m['halloween.faq.commercial.a'](),
  },
  when: {
    question: () => m['halloween.faq.when.q'](),
    answer: () => m['halloween.faq.when.a'](),
  },
};

export const HALLOWEEN_FAQ_KEYS = [
  'official',
  'copy',
  'popular',
  'free',
  'commercial',
  'when',
] as const;

export const halloweenFaqCopy = (key: string, field = 'question') =>
  FAQ_COPY[key]?.[field]?.() ?? '';

export function HalloweenFaq() {
  return (
    <section
      id="faq"
      className="border-border scroll-mt-20 border-t px-4 py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            title={m['halloween.faq.title']()}
            description={m['halloween.faq.description']()}
          />
        </div>
        <Accordion className="w-full">
          {HALLOWEEN_FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="font-display cursor-pointer py-5 text-left text-[17px] font-semibold tracking-tight hover:no-underline">
                {halloweenFaqCopy(key, 'question')}
              </AccordionTrigger>
              {/* keepMounted: answers stay in the SSR HTML for search engines. */}
              <AccordionContent
                keepMounted
                className="text-muted-foreground pb-5 text-[15px] leading-relaxed"
              >
                {halloweenFaqCopy(key, 'answer')}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
