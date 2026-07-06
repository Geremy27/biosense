import { UserRole } from '~/db/models/enums';

type StatusBadgeVariant = 'provider' | 'admin' | 'active' | 'inactive';

type StatusBadgeProps = {
  label: string;
  variant: StatusBadgeVariant;
};

const VARIANT_CLASSES: Record<StatusBadgeVariant, string> = {
  provider: 'badge-role-provider',
  admin: 'badge-role-admin',
  active: 'badge-status-active',
  inactive: 'badge-status-inactive',
};

// Renders a pill badge for roles or status values.
export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return <span className={`badge-pill ${VARIANT_CLASSES[variant]}`}>{label}</span>;
}

// Maps a user role enum to a localized badge label and variant.
export function RoleBadge({ role }: { role: UserRole }) {
  if (role === UserRole.PLATFORM_ADMIN) {
    return <StatusBadge label="Administrador" variant="admin" />;
  }

  if (role === UserRole.PROVIDER) {
    return <StatusBadge label="Prestador" variant="provider" />;
  }

  return <StatusBadge label={role} variant="inactive" />;
}
