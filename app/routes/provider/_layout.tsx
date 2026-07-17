import { findOrganizationById } from '~/db/repositories/organizations.repository';
import { findProviderByUserId } from '~/db/repositories/providers.repository';
import { LayoutDashboard, Users } from 'lucide-react';
import { Outlet, redirect } from 'react-router';

import { APP_INITIAL, APP_NAME } from '~/brand';
import { AppSidebarLayout, type SidebarNavItem } from '~/components/layout/app-sidebar-layout';
import { auth } from '~/utils/auth.server';
import { requireProvider } from '~/utils/session.server';

import type { Route } from './+types/_layout';

const NAV_ITEMS: SidebarNavItem[] = [
  { to: '/provider', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/provider/patients', label: 'Pacientes', icon: Users },
];

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireProvider(request);
  const provider = await findProviderByUserId(session.user.id);
  const organization = provider
    ? await findOrganizationById(provider.organizationId)
    : null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      subtitle: organization?.name ?? null,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  await auth.api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });

  throw redirect('/provider/login');
}

export default function ProviderLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AppSidebarLayout
      brandEyebrow="Consultorio"
      brandTitle={APP_NAME}
      brandInitial={APP_INITIAL}
      navItems={NAV_ITEMS}
      user={loaderData.user}
    >
      <Outlet />
    </AppSidebarLayout>
  );
}
