import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const SEEDREAM_LITE_SOURCE =
  'https://seed.bytedance.com/en/blog/deeper-thinking-more-accurate-generation-introducing-seedream-5-0-lite';
export const SEEDREAM_PRO_SOURCE =
  'https://seed.bytedance.com/en/blog/beyond-generation-it-understands-design-introducing-seedream-5-0-pro';

/** The route loader and visible FAQ use the same explicitly localized copy. */
export function seedreamFaq(locale = getLocale()) {
  const options = { locale };
  return [
    {
      question: m['seedream.faq.model.question']({}, options),
      answer: m['seedream.faq.model.answer']({}, options),
    },
    {
      question: m['seedream.faq.free.question']({}, options),
      answer: m['seedream.faq.free.answer']({}, options),
    },
    {
      question: m['seedream.faq.prompt.question']({}, options),
      answer: m['seedream.faq.prompt.answer']({}, options),
    },
    {
      question: m['seedream.faq.edit.question']({}, options),
      answer: m['seedream.faq.edit.answer']({}, options),
    },
    {
      question: m['seedream.faq.fail.question']({}, options),
      answer: m['seedream.faq.fail.answer']({}, options),
    },
    {
      question: m['seedream.faq.commercial.question']({}, options),
      answer: m['seedream.faq.commercial.answer']({}, options),
    },
    {
      question: m['seedream.faq.official.question']({}, options),
      answer: m['seedream.faq.official.answer']({}, options),
    },
  ];
}

export function SeedreamHero() {
  return (
    <section className="px-4 pt-8 pb-8 sm:pt-12 sm:pb-10">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-banana-ink mb-3 font-mono text-xs font-medium tracking-[0.08em]">
            {m['seedream.hero.eyebrow']()}
          </p>
          <h1 className="font-display min-w-0 text-[clamp(1.75rem,4.2vw,3.5rem)] leading-[1.15] font-semibold tracking-[-0.04em] lg:whitespace-nowrap">
            <span>{m['seedream.hero.title']()}</span>{' '}
            <span className="text-muted-foreground">
              {m['seedream.hero.subtitle']()}
            </span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
            {m['seedream.hero.description']()}
          </p>
        </div>
        <nav
          aria-label={m['seedream.hero.title']()}
          className="mt-4 flex flex-wrap gap-x-6 gap-y-2"
        >
          <Link
            href="#prompts"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:underline hover:underline-offset-4"
          >
            {m['seedream.hero.prompts']()}
            <ArrowDownRight aria-hidden className="size-4" />
          </Link>
          <Link
            href="#guide"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:underline hover:underline-offset-4"
          >
            {m['seedream.hero.guide']()}
            <ArrowDownRight aria-hidden className="size-4" />
          </Link>
        </nav>
      </div>
    </section>
  );
}

export function SeedreamGuide() {
  const comparison = [
    {
      label: m['seedream.compare.focus.label'](),
      lite: m['seedream.compare.focus.lite'](),
      pro: m['seedream.compare.focus.pro'](),
    },
    {
      label: m['seedream.compare.content.label'](),
      lite: m['seedream.compare.content.lite'](),
      pro: m['seedream.compare.content.pro'](),
    },
    {
      label: m['seedream.compare.here.label'](),
      lite: m['seedream.compare.here.lite'](),
      pro: m['seedream.compare.here.pro'](),
    },
  ];
  const steps = [
    {
      title: m['seedream.guide.subject.title'](),
      body: m['seedream.guide.subject.body'](),
    },
    {
      title: m['seedream.guide.composition.title'](),
      body: m['seedream.guide.composition.body'](),
    },
    {
      title: m['seedream.guide.light.title'](),
      body: m['seedream.guide.light.body'](),
    },
    {
      title: m['seedream.guide.iterate.title'](),
      body: m['seedream.guide.iterate.body'](),
    },
  ];
  return (
    <section
      id="guide"
      aria-labelledby="seedream-about-title"
      className="border-border scroll-mt-24 border-t px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <h2
            id="seedream-about-title"
            className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
          >
            {m['seedream.about.title']()}
          </h2>
          <div className="text-muted-foreground max-w-3xl space-y-5 text-base leading-8">
            <p>{m['seedream.about.body']()}</p>
            <p>{m['seedream.about.body_two']()}</p>
            <a
              href={SEEDREAM_LITE_SOURCE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground inline-flex items-center gap-2 text-sm underline underline-offset-4"
            >
              {m['seedream.about.source']()}
              <ArrowUpRight aria-hidden className="size-4 shrink-0" />
            </a>
          </div>
        </div>
        <div className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-2">
          <article className="bg-muted/65 rounded-xl p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {m['seedream.capability.reasoning.title']()}
            </h3>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              {m['seedream.capability.reasoning.body']()}
            </p>
          </article>
          <article className="bg-accent/60 rounded-xl p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {m['seedream.capability.text.title']()}
            </h3>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              {m['seedream.capability.text.body']()}
            </p>
          </article>
        </div>
        <div className="mt-16 sm:mt-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {m['seedream.compare.title']()}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            {m['seedream.compare.description']()}
          </p>
          <div className="border-border mt-8 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[620px] text-left text-sm">
              <caption className="sr-only">
                {m['seedream.compare.title']()}
              </caption>
              <thead className="bg-muted/65">
                <tr>
                  <th scope="col" className="w-1/4 px-6 py-5 font-medium">
                    {m['seedream.compare.feature']()}
                  </th>
                  <th scope="col" className="w-[37.5%] px-6 py-5 font-semibold">
                    {m['seedream.compare.lite']()}
                  </th>
                  <th scope="col" className="px-6 py-5 font-semibold">
                    {m['seedream.compare.pro']()}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, index) => (
                  <tr
                    key={row.label}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                  >
                    <th scope="row" className="px-6 py-5 font-medium">
                      {row.label}
                    </th>
                    <td className="text-muted-foreground px-6 py-5 leading-relaxed">
                      {row.lite}
                    </td>
                    <td className="text-muted-foreground px-6 py-5 leading-relaxed">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground mt-4 max-w-3xl text-sm leading-7">
            {m['seedream.compare.note']()}
          </p>
          <a
            href={SEEDREAM_PRO_SOURCE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4"
          >
            {m['seedream.compare.source']()}
            <ArrowUpRight aria-hidden className="size-4 shrink-0" />
          </a>
        </div>
        <div className="mt-16 grid gap-10 sm:mt-24 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <h2 className="font-display max-w-md text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {m['seedream.guide.title']()}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md leading-relaxed">
              {m['seedream.guide.description']()}
            </p>
            <aside className="border-border mt-8 rounded-xl border p-6">
              <h3 className="text-sm font-medium">
                {m['seedream.formula.title']()}
              </h3>
              <p className="font-display mt-4 text-xl leading-relaxed font-medium">
                {m['seedream.formula.template']()}
              </p>
              <p className="text-muted-foreground mt-4 text-sm leading-7">
                {m['seedream.formula.body']()}
              </p>
            </aside>
          </div>
          <ol className="space-y-9">
            {steps.map((step) => (
              <li key={step.title} className="border-banana border-l-2 pl-6">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function SeedreamFaq() {
  return (
    <section
      aria-labelledby="seedream-faq-title"
      className="border-border border-t px-4 py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
        <h2
          id="seedream-faq-title"
          className="font-display max-w-sm text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
        >
          {m['seedream.faq.title']()}
        </h2>
        <Accordion multiple>
          {seedreamFaq().map((faq) => (
            <AccordionItem key={faq.question}>
              <AccordionTrigger className="min-h-16 gap-4 py-5 text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pr-5 pb-6 leading-7">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function SeedreamResources() {
  const links = [
    {
      href: '/#create',
      title: m['seedream.resources.nano_title'](),
      label: m['seedream.resources.nano'](),
    },
    {
      href: '/pricing',
      title: m['seedream.resources.pricing_title'](),
      label: m['seedream.resources.pricing'](),
    },
    {
      href: '/blog',
      title: m['seedream.resources.blog_title'](),
      label: m['seedream.resources.blog'](),
    },
  ];
  return (
    <section
      id="explore"
      className="border-border border-t px-4 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {m['seedream.resources.title']()}
        </h2>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group border-border bg-card hover:border-foreground/30 focus-visible:ring-ring flex min-w-0 flex-col rounded-xl border p-5 transition-colors outline-none focus-visible:ring-2 sm:p-6"
            >
              <span className="font-display flex items-center justify-between gap-4 text-lg font-semibold">
                <span>{link.title}</span>
                <ArrowUpRight
                  aria-hidden
                  className="size-5 shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                />
              </span>
              <span className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
        <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
          {m['seedream.resources.notice']()}
        </p>
      </div>
    </section>
  );
}
