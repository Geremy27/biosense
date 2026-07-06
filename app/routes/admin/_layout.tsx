import { useState } from 'react';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelRightOpen,
  Users,
} from 'lucide-react';
import { Form, NavLink, Outlet, redirect, useLoaderData } from 'react-router';

import { auth } from '~/utils/auth.server';
import { requirePlatformAdmin } from '~/utils/session.server';

import type { Route } from './+types/_layout';

const NAV_ITEMS = [
  { to: '/admin', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/admin/organizations', label: 'Organizaciones', icon: Building2 },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
] as const;

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

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requirePlatformAdmin(request);

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  await auth.api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });

  throw redirect('/admin/login');
}

export default function AdminLayout() {
  const data = useLoaderData<typeof loader>();
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
                <p className="eyebrow">Administración</p>
                <h1 className="mt-1 text-lg font-bold tracking-tight text-cyan-950">Health EMR</h1>
              </div>
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-cyan-50 text-sm font-bold text-cyan-700">
                H
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
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
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
              <p className="truncate text-sm font-semibold text-cyan-950">{data.user.name}</p>
              <p className="truncate text-xs text-slate-500">{data.user.email}</p>
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

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
