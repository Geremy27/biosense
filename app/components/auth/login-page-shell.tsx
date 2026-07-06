import type { ReactNode } from 'react';

type LoginPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

// Renders a centered login card on the aurora background.
export function LoginPageShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: LoginPageShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-md card-elevated">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-cyan-950">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        {children}
        {footer ? <div className="mt-6 border-t border-slate-100 pt-6">{footer}</div> : null}
      </div>
    </main>
  );
}
