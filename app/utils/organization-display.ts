import { OrganizationType } from '~/db/models/enums';

export const ORGANIZATION_TYPE_OPTIONS = [
  { value: OrganizationType.PERSONA_NATURAL, label: 'Persona natural' },
  { value: OrganizationType.PERSONA_JURIDICA, label: 'Persona jurídica' },
] as const;

// Formats an organization type enum value for display.
export function formatOrganizationType(type: OrganizationType) {
  return ORGANIZATION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
