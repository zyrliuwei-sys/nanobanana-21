import { m } from '@/paraglide/messages.js';
import { SectionHeading } from '@/components/section-heading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Static message lookups (not tDynamic) so the page only bundles the
// strings it renders.
const COPY: Record<string, Record<string, () => string>> = {
  what: {
    question: () => m['landing.faq.what.question'](),
    answer: () => m['landing.faq.what.answer'](),
  },
  versions: {
    question: () => m['landing.faq.versions.question'](),
    answer: () => m['landing.faq.versions.answer'](),
  },
  free: {
    question: () => m['landing.faq.free.question'](),
    answer: () => m['landing.faq.free.answer'](),
  },
  apikey: {
    question: () => m['landing.faq.apikey.question'](),
    answer: () => m['landing.faq.apikey.answer'](),
  },
  resolution: {
    question: () => m['landing.faq.resolution.question'](),
    answer: () => m['landing.faq.resolution.answer'](),
  },
  references: {
    question: () => m['landing.faq.references.question'](),
    answer: () => m['landing.faq.references.answer'](),
  },
  credits: {
    question: () => m['landing.faq.credits.question'](),
    answer: () => m['landing.faq.credits.answer'](),
  },
  commercial: {
    question: () => m['landing.faq.commercial.question'](),
    answer: () => m['landing.faq.commercial.answer'](),
  },
};
export const faqCopy = (key: string, field = 'text') =>
  COPY[key]?.[field]?.() ?? '';

export const FAQ_KEYS = [
  'what',
  'versions',
  'free',
  'apikey',
  'resolution',
  'references',
  'credits',
  'commercial',
] as const;

export function FAQ() {
  return (
    <section
      id="faq"
      className="border-border scroll-mt-20 border-t px-4 py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            title={m['landing.faq.title']()}
            description={m['landing.faq.description']()}
          />
        </div>
        <Accordion className="w-full">
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="font-display cursor-pointer py-5 text-left text-[17px] font-semibold tracking-tight hover:no-underline">
                {faqCopy(key, 'question')}
              </AccordionTrigger>
              {/* keepMounted: answers stay in the SSR HTML for search engines. */}
              <AccordionContent
                keepMounted
                className="text-muted-foreground pb-5 text-[15px] leading-relaxed"
              >
                {faqCopy(key, 'answer')}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
