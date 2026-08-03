import { MedicalHistoryStatus } from '~/db/models/enums';

const STATUS_LABELS: Record<MedicalHistoryStatus, string> = {
  [MedicalHistoryStatus.EXTRACTING]: 'Extrayendo',
  [MedicalHistoryStatus.DRAFT]: 'Borrador',
  [MedicalHistoryStatus.CONFIRMED]: 'Confirmado',
  [MedicalHistoryStatus.FAILED]: 'Requiere atención',
};

export function formatMedicalHistoryStatus(status: MedicalHistoryStatus) {
  return STATUS_LABELS[status];
}

export function medicalHistoryStatusBadgeVariant(
  status: MedicalHistoryStatus,
): 'active' | 'inactive' {
  return status === MedicalHistoryStatus.CONFIRMED ? 'active' : 'inactive';
}

export function formatMedicalHistoryDate(value: string | null | undefined) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function formatMedicalHistoryCreatedAt(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
