import { cn } from '@/lib/utils';

/**
 * Section header: optional small mono eyebrow, display title, body line.
 * `accent` (optional) is rendered after the title with the banana marker.
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = 'left',
  as: Tag = 'h2',
  className,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  align?: 'center' | 'left';
  as?: 'h1' | 'h2';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <p className="text-banana-ink mb-4 font-mono text-xs font-medium tracking-[0.14em] uppercase">
          {eyebrow}
        </p>
      )}
      <Tag className="font-display text-[2rem] leading-[1.08] font-semibold tracking-[-0.025em] text-balance sm:text-[2.75rem]">
        {title}
        {accent && (
          <>
            {' '}
            <span className="marker">{accent}</span>
          </>
        )}
      </Tag>
      {description && (
        <p className="text-muted-foreground mt-4 text-base leading-relaxed text-pretty sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
