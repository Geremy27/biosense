import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  headingLevel?: 'h1' | 'h2';
  actions?: ReactNode;
};

// Renders a page title block with eyebrow, heading, optional description, and actions.
export function PageHeader({
  eyebrow,
  title,
  description,
  headingLevel = 'h2',
  actions,
}: PageHeaderProps) {
  const Heading = headingLevel;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-4">{eyebrow}</p>
        <Heading className="text-2xl font-bold tracking-tight text-cyan-950">{title}</Heading>
        {description ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
