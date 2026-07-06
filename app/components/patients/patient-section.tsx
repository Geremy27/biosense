import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type PatientSectionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
};

// Renders a titled clinical section on the patient view page.
export function PatientSection({ title, description, icon: Icon, children }: PatientSectionProps) {
  return (
    <section className="card">
      <div className="flex items-start gap-4">
        <div className="icon-container">
          <Icon className="size-5 text-cyan-600" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-cyan-950">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
