import { Link } from 'react-router';

export type FilterTab = {
  label: string;
  href: string;
  isActive: boolean;
};

type FilterTabsProps = {
  tabs: FilterTab[];
};

// Renders horizontal filter tabs for list pages.
export function FilterTabs({ tabs }: FilterTabsProps) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          to={tab.href}
          className={tab.isActive ? 'filter-tab-active' : 'filter-tab'}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
