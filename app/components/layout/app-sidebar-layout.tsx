import { useState, type ReactNode } from 'react';
import { LogOut, PanelLeftClose, PanelRightOpen, type LucideIcon } from 'lucide-react';
import { Form, NavLink } from 'react-router';

export type SidebarNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type AppSidebarLayoutProps = {
  brandEyebrow: string;
  brandTitle: string;
  brandInitial: string;
  navItems: SidebarNavItem[];
  user: {
    name: string;
    email: string;
    subtitle?: string | null;
  };
  children: ReactNode;
};

// Returns sidebar link classes based on the active route and collapsed state.
function sidebarLinkClass(isActive: boolean, collapsed: boolean) {
  return [
    'admin-sidebar-link',
    isActive ? 'admin-sidebar-link-active' : '',
    collapsed ? 'admin-sidebar-link-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

// Renders a collapsible sidebar shell with navigation and logout.
export function AppSidebarLayout({
  brandEyebrow,
  brandTitle,
  brandInitial,
  navItems,
  user,
  children,
}: AppSidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <aside
        className={`flex shrink-0 flex-col border-r border-cyan-200 bg-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`border-b border-cyan-100 ${collapsed ? 'px-2 py-4' : 'px-4 py-5'}`}>
          <div
            className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between gap-3'}`}
          >
            {!collapsed ? (
              <div className="min-w-0">
                <p className="eyebrow">{brandEyebrow}</p>
                <h1 className="mt-1 text-lg font-bold tracking-tight text-cyan-950">{brandTitle}</h1>
              </div>
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-cyan-50 text-sm font-bold text-cyan-700">
                {brandInitial}
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-cyan-950"
            >
              {collapsed ? (
                <PanelRightOpen className="size-4" aria-hidden />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <nav className={`flex flex-1 flex-col gap-1 py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => sidebarLinkClass(isActive, collapsed)}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className={`border-t border-cyan-100 py-4 ${collapsed ? 'px-2' : 'px-4'}`}>
          {!collapsed ? (
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="truncate text-sm font-semibold text-cyan-950">{user.name}</p>
              {user.subtitle ? (
                <p className="truncate text-xs font-medium text-cyan-600">{user.subtitle}</p>
              ) : null}
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          ) : null}
          <Form method="post" className={collapsed ? '' : 'mt-3'}>
            <button
              type="submit"
              title={collapsed ? 'Cerrar sesión' : undefined}
              className={`btn-ghost gap-2 ${collapsed ? 'w-full justify-center px-2' : 'w-full'}`}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              {!collapsed ? 'Cerrar sesión' : <span className="sr-only">Cerrar sesión</span>}
            </button>
          </Form>
        </div>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}
