import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';

type StatCardProps = {
  label: string;
  value: number | string;
  to?: string;
  icon?: LucideIcon;
  detailLabel?: string;
  comingSoon?: boolean;
};

// Renders a metric card, optionally linked to a detail route.
export function StatCard({
  label,
  value,
  to,
  icon: Icon,
  detailLabel = 'Ver detalle',
  comingSoon = false,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-4xl font-bold text-cyan-950">{value}</p>
        </div>
        {Icon ? (
          <div className="icon-container">
            <Icon className="size-5 text-cyan-600" aria-hidden />
          </div>
        ) : null}
      </div>
      {to && !comingSoon ? (
        <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-cyan-600">
          {detailLabel}
          <ArrowRight className="size-4" aria-hidden />
        </p>
      ) : null}
      {comingSoon ? (
        <p className="mt-4 text-sm font-semibold text-slate-400">Próximamente</p>
      ) : null}
    </>
  );

  if (comingSoon) {
    return <div className="card opacity-60">{content}</div>;
  }

  if (to) {
    return (
      <Link to={to} className="stat-card-interactive">
        {content}
      </Link>
    );
  }

  return <div className="card">{content}</div>;
}
