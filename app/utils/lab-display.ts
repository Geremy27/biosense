import { LabReportStatus } from '~/db/models/enums';

const STATUS_LABELS: Record<LabReportStatus, string> = {
  [LabReportStatus.EXTRACTING]: 'Extrayendo',
  [LabReportStatus.PENDING_REVIEW]: 'Pendiente de revisión',
  [LabReportStatus.CONFIRMED]: 'Confirmado',
  [LabReportStatus.FAILED]: 'Requiere atención',
};

export function formatLabReportStatus(status: LabReportStatus) {
  return STATUS_LABELS[status];
}

export function formatLabDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export function formatLabUploadDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
