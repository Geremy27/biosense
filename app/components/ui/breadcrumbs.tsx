import { Link } from 'react-router';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

// Renders a breadcrumb trail for form and detail pages.
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <span className="text-slate-300" aria-hidden>
                  /
                </span>
              ) : null}
              {item.to && !isLast ? (
                <Link to={item.to} className="font-medium hover:text-cyan-600 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-cyan-950' : 'font-medium'}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
