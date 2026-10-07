import { m } from '@/paraglide/messages.js';
import { FooterBadgeList } from '@/components/footer-badge-list';
import { SiteFooter, type FooterColumn } from '@/components/site-footer';

export function Footer() {
  const columns: FooterColumn[] = [
    {
      title: m['landing.footer.product'](),
      links: [
        { label: m['landing.nav.create'](), href: '/#create' },
        { label: m['landing.nav.features'](), href: '/#features' },
        { label: m['landing.nav.showcase'](), href: '/#showcase' },
        { label: m['landing.nav.pricing'](), href: '/pricing' },
      ],
    },
    {
      title: m['landing.footer.resources'](),
      links: [
        { label: m['landing.footer.blog'](), href: '/blog' },
        { label: m['landing.footer.faq'](), href: '/#faq' },
        {
          label: 'support@nanobanana-21.com',
          href: 'mailto:support@nanobanana-21.com',
        },
      ],
    },
    {
      title: m['landing.footer.legal'](),
      links: [
        { label: m['landing.footer.privacy'](), href: '/privacy-policy' },
        { label: m['landing.footer.terms'](), href: '/terms-of-service' },
        { label: m['landing.footer.aup'](), href: '/acceptable-use-policy' },
      ],
    },
  ];

  return (
    <SiteFooter
      tagline={m['landing.footer.tagline']()}
      columns={columns}
      badges={<FooterBadgeList className="mt-10" />}
    />
  );
}
