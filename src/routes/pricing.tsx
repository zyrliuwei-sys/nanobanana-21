import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Pricing } from '@/blocks/pricing';

export const Route = createFileRoute('/pricing')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['landing.pricing.title']({}, { locale }),
      description: m['landing.pricing.description']({}, { locale }),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/pricing`, { locale: loc as any }).href;
    const title = `${loaderData.title} | ${envConfigs.app_name}`;
    return {
      meta: [
        { title },
        { name: 'description', content: loaderData.description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: loaderData.description },
      ],
      links: [
        { rel: 'canonical', href: urlFor(loaderData.locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
      ],
    };
  },
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Pricing headingLevel="h1" />
      </main>
      <Footer />
    </div>
  );
}
