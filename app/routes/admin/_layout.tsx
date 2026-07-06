import { Building2, LayoutDashboard, Users } from 'lucide-react';
import { Outlet, redirect, useLoaderData } from 'react-router';

import { AppSidebarLayout, type SidebarNavItem } from '~/components/layout/app-sidebar-layout';
import { auth } from '~/utils/auth.server';
import { requirePlatformAdmin } from '~/utils/session.server';

import type { Route } from './+types/_layout';

const NAV_ITEMS: SidebarNavItem[] = [
  { to: '/admin', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/admin/organizations', label: 'Organizaciones', icon: Building2 },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
];

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

  return (
    <AppSidebarLayout
      brandEyebrow="Administración"
      brandTitle="Health EMR"
      brandInitial="H"
      navItems={NAV_ITEMS}
      user={data.user}
    >
      <Outlet />
    </AppSidebarLayout>
  );
}
