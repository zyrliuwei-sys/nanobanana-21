import { DEFAULT_IMAGE_MODEL } from '@/config/image-gen';
import { m } from '@/paraglide/messages.js';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';

export function About() {
  const specs: [string, string, boolean?][] = [
    [m['landing.about.spec.model'](), DEFAULT_IMAGE_MODEL, true],
    [m['landing.about.spec.family'](), m['landing.about.spec.family_value']()],
    [m['landing.about.spec.output'](), '1K / 2K / 4K', true],
    [
      m['landing.about.spec.references'](),
      m['landing.about.spec.references_value'](),
    ],
    [m['landing.about.spec.ratios'](), m['landing.about.spec.ratios_value']()],
    [m['landing.about.spec.input'](), m['landing.about.spec.input_value']()],
    [m['landing.about.spec.speed'](), m['landing.about.spec.speed_value']()],
  ];

  return (
    <section
      id="about"
      className="border-border scroll-mt-20 border-t px-4 py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_420px] lg:gap-20">
        <Reveal>
          <SectionHeading
            eyebrow={m['landing.about.eyebrow']()}
            title={m['landing.about.title']()}
          />
          <div className="text-foreground/85 mt-8 max-w-2xl space-y-5 text-[17px] leading-[1.75]">
            <p>{m['landing.about.p1']()}</p>
            <p>{m['landing.about.p2']()}</p>
            <p>{m['landing.about.p3']()}</p>
          </div>
        </Reveal>

        <Reveal>
          <aside className="bg-card border-border rounded-xl border p-7 lg:sticky lg:top-28">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {m['landing.about.spec_title']()}
            </h3>
            <dl className="mt-6 space-y-4">
              {specs.map(([label, value, mono]) => (
                <div
                  key={label}
                  className="grid grid-cols-[120px_1fr] items-baseline gap-4"
                >
                  <dt className="text-muted-foreground text-sm">{label}</dt>
                  <dd
                    className={
                      mono
                        ? 'font-mono text-[13px] break-all'
                        : 'text-sm font-medium'
                    }
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
