import { createFileRoute, Outlet } from '@tanstack/react-router';

import { SHOWCASE } from '@/config/showcase';
import { webpSrcSet } from '@/lib/img';
import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/(auth)')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex,nofollow' }] }),
  component: AuthLayout,
});

// Form on the left, a contact sheet of example images on the right (lg+).
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
          {[SHOWCASE[0], SHOWCASE[1], SHOWCASE[4], SHOWCASE[7]].map(
            (item, i) => (
              <div
                key={item.key}
                className={`frame ${i % 2 ? 'translate-y-8' : ''}`}
              >
                <img
                  src={item.src}
                  srcSet={webpSrcSet(item.src)}
                  sizes="220px"
                  alt=""
                  width={300}
                  height={375}
                  className="aspect-[4/5] w-full rounded-[calc(var(--radius)-2px)] object-cover"
                />
              </div>
            )
          )}
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
