import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { SEEDREAM_IMAGES } from '@/config/seedream-gallery';
import { jsonLd } from '@/lib/json-ld';
import { m } from '@/paraglide/messages.js';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import {
  SeedreamFaq,
  seedreamFaq,
  SeedreamGuide,
  SeedreamHero,
  SeedreamResources,
} from '@/blocks/seedream-content';
import { SeedreamGenerator } from '@/blocks/seedream-generator';

export const Route = createFileRoute('/seedream-5-0')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['seedream.meta.title']({}, { locale }),
      description: m['seedream.meta.description']({}, { locale }),
      faq: seedreamFaq(locale),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const urlFor = (locale: (typeof locales)[number]) =>
      localizeUrl(new URL('/seedream-5-0', envConfigs.app_url), { locale })
        .href;
    const url = urlFor(loaderData.locale);
    const title = `${loaderData.title} | ${envConfigs.app_name}`;
    const image = new URL(SEEDREAM_IMAGES.landscape.src, envConfigs.app_url)
      .href;
    return {
      meta: [
        { title },
        { name: 'description', content: loaderData.description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: loaderData.description },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: image },
        {
          property: 'og:image:alt',
          content: m['seedream.gen.preview']({}, { locale: loaderData.locale }),
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: loaderData.description },
        { name: 'twitter:image', content: image },
      ],
      links: [
        { rel: 'canonical', href: url },
        ...locales.map((locale) => ({
          rel: 'alternate',
          hrefLang: locale,
          href: urlFor(locale),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor(baseLocale) },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                '@id': `${url}#webpage`,
                url,
                name: title,
                description: loaderData.description,
                inLanguage: loaderData.locale,
                mainEntity: { '@id': `${url}#application` },
              },
              {
                '@type': 'WebApplication',
                '@id': `${url}#application`,
                name: loaderData.title,
                url: `${url}#generator`,
                description: loaderData.description,
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Web',
                inLanguage: loaderData.locale,
                featureList: [
                  'Seedream 5.0 Lite',
                  '2K text-to-image',
                  '1:1, 4:3, 3:4, 16:9, 9:16',
                ],
                isAccessibleForFree: false,
              },
              {
                '@type': 'FAQPage',
                mainEntity: loaderData.faq.map((item) => ({
                  '@type': 'Question',
                  name: item.question,
                  acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
              },
            ],
          }),
        },
      ],
    };
  },
  component: SeedreamPage,
});

function SeedreamPage() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <SeedreamHero />
        <SeedreamGenerator />
        <SeedreamGuide />
        <SeedreamFaq />
        <SeedreamResources />
      </main>
      <Footer />
    </div>
  );
}
