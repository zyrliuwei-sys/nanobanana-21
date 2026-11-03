import type { ComponentType, ReactNode, SVGProps } from 'react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { cn } from '@/lib/utils';

export interface FooterColumn {
  title: string;
  /** external: open in a new tab. Off-site (http) hrefs always open in a new tab. */
  links: { label: string; href: string; external?: boolean }[];
}

/** Off-site URLs render as plain <a>; internal paths use the locale-aware Link. */
const isExternalHref = (href: string) => /^(https?:\/\/|mailto:)/.test(href);

export interface FooterSocial {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  label: string;
}

export function SiteFooter({
  tagline,
  columns,
  socials,
  copyright,
  badges,
}: {
  tagline?: string;
  columns?: FooterColumn[];
  socials?: FooterSocial[];
  copyright?: string;
  /** Rendered above the socials row, e.g. admin-managed footer badges. */
  badges?: ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background text-foreground border-border border-t px-4">
      <div className="mx-auto max-w-7xl pt-12 pb-6 sm:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <Link
              href="/"
              className="font-display inline-flex min-h-10 items-center gap-2.5 text-lg font-semibold tracking-tight"
            >
              <img
                src={envConfigs.app_logo}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-md"
              />
              {envConfigs.app_name}
            </Link>
            {tagline && (
              <p className="text-muted-foreground mt-4 max-w-xs text-base leading-relaxed">
                {tagline}
              </p>
            )}
          </div>
          {columns && columns.length > 0 && (
            <div
              className={cn(
                'grid min-w-0 gap-x-6 gap-y-8',
                columns.length <= 3
                  ? 'sm:grid-cols-3'
                  : columns.length === 4
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
              )}
            >
              {columns.map((col) => (
                <div key={col.title} className="min-w-0 space-y-3">
                  <p className="text-foreground text-[13px] font-semibold tracking-wide">
                    {col.title}
                  </p>
                  <ul className="space-y-0.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        {isExternalHref(link.href) ? (
                          <a
                            href={link.href}
                            target={
                              link.href.startsWith('mailto:')
                                ? undefined
                                : '_blank'
                            }
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground inline-flex min-h-9 items-center text-sm whitespace-nowrap transition-colors"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            className="text-muted-foreground hover:text-foreground inline-flex min-h-9 items-center text-sm whitespace-nowrap transition-colors"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {badges}

        {/* Socials + language row */}
        {socials && socials.length > 0 && (
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <s.icon className="size-[18px]" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="border-border mt-8 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground text-sm">
            {copyright ||
              `© ${year} ${envConfigs.app_name}. All rights reserved.`}
          </span>
        </div>
      </div>
    </footer>
  );
}
