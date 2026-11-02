import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { jsonLd } from '@/lib/json-ld';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import {
  HALLOWEEN_FAQ_KEYS,
  HalloweenContent,
  HalloweenCopySection,
  HalloweenFaq,
  halloweenFaqCopy,
  HalloweenHero,
} from '@/blocks/halloween-emoji';
import { HalloweenGenerator } from '@/blocks/halloween-generator';
import { Header } from '@/blocks/header';

export const Route = createFileRoute('/halloween-emoji')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['halloween.meta.title']({}, { locale }),
      description: m['halloween.meta.description']({}, { locale }),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/halloween-emoji`, {
        locale: loc as any,
      }).href;
    const title = `${loaderData.title} | ${envConfigs.app_name}`;
    const url = urlFor(loaderData.locale);
    return {
      meta: [
        { title },
        { name: 'description', content: loaderData.description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: loaderData.description },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${envConfigs.app_url}/og.jpg` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: loaderData.description },
      ],
      links: [
        { rel: 'canonical', href: url },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: loaderData.title,
            url,
            description: loaderData.description,
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web',
            inLanguage: loaderData.locale,
          }),
        },
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: HALLOWEEN_FAQ_KEYS.map((key) => ({
              '@type': 'Question',
              name: halloweenFaqCopy(key, 'question'),
              acceptedAnswer: {
                '@type': 'Answer',
                text: halloweenFaqCopy(key, 'answer'),
              },
            })),
          }),
        },
      ],
    };
  },
  component: HalloweenEmojiPage,
});

function HalloweenEmojiPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HalloweenHero />
        <section
          id="generator"
          className="border-border scroll-mt-20 border-t px-4 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-[1.75rem] leading-tight font-semibold tracking-tight">
              {m['halloween.gen.title']()}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed">
              {m['halloween.gen.description']()}
            </p>
            <div className="mt-8">
              <HalloweenGenerator />
            </div>
          </div>
        </section>
        <HalloweenCopySection />
        <HalloweenContent />
        <HalloweenFaq />
      </main>
      <Footer />
    </div>
  );
}
