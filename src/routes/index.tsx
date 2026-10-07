import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { jsonLd } from '@/lib/json-ld';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { About } from '@/blocks/about';
import { CTA } from '@/blocks/cta';
import { FAQ, FAQ_KEYS, faqCopy } from '@/blocks/faq';
import { Features } from '@/blocks/features';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Hero } from '@/blocks/hero';
import { HowItWorks } from '@/blocks/how-it-works';
import { Pricing } from '@/blocks/pricing';
import { Showcase } from '@/blocks/showcase';
import { Tips } from '@/blocks/tips';
import { UseCases } from '@/blocks/use-cases';

const OG_IMAGE = '/og.jpg';

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Showcase />
        <About />
        <Features />
        <HowItWorks />
        <Tips />
        <UseCases />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

export const Route = createFileRoute('/')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = (loaderData?.locale ?? 'en') as any;
    const title = m['common.metadata.title']({}, { locale });
    const description = m['common.metadata.description']({}, { locale });
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/`, { locale: loc as any }).href;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${envConfigs.app_url}${OG_IMAGE}` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
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
            name: envConfigs.app_name,
            url: urlFor(locale),
            description,
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web',
            inLanguage: locale,
          }),
        },
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_KEYS.map((key) => ({
              '@type': 'Question',
              name: faqCopy(key, 'question'),
              acceptedAnswer: {
                '@type': 'Answer',
                text: faqCopy(key, 'answer'),
              },
            })),
          }),
        },
      ],
    };
  },
  component: HomePage,
});
