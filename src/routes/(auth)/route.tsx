import { createFileRoute, Outlet } from '@tanstack/react-router';

import { webpSrcSet } from '@/lib/img';
import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/(auth)')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex,nofollow' }] }),
  component: AuthLayout,
});

// Form on the left, a contact sheet of example images on the right (lg+).
const AUTH_PRINTS = [
  '/imgs/generated/auth-1-3cc30445.jpg',
  '/imgs/generated/auth-2-18966862.jpg',
  '/imgs/generated/auth-3-c5536bfd.jpg',
  '/imgs/generated/auth-4-a30ca943.jpg',
];

function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_minmax(0,44%)]">
      <div className="min-w-0">
        <Outlet />
      </div>
      <aside
        aria-hidden
        className="bg-card border-border relative hidden flex-col justify-center overflow-hidden border-l px-14 py-16 lg:flex"
      >
        <div className="grid max-w-md grid-cols-2 gap-4">
          {AUTH_PRINTS.map((src, i) => (
            <div key={src} className={`frame ${i % 2 ? 'translate-y-8' : ''}`}>
              <img
                src={src}
                srcSet={webpSrcSet(src)}
                sizes="220px"
                alt=""
                width={300}
                height={375}
                className="aspect-[4/5] w-full rounded-[calc(var(--radius)-2px)] object-cover"
              />
            </div>
          ))}
        </div>
        <p className="font-display mt-16 max-w-md text-2xl leading-snug font-semibold tracking-tight">
          {m['landing.cta.headline']()}
        </p>
        <p className="text-muted-foreground mt-3 max-w-md">
          {m['landing.cta.subheadline']()}
        </p>
      </aside>
    </div>
  );
}
