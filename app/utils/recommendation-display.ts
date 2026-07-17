import { ClinicalRecommendationStatus } from '~/db/models/enums';
import type { RecommendationOutput } from '~/validation/recommendations';

const STATUS_LABELS: Record<ClinicalRecommendationStatus, string> = {
  [ClinicalRecommendationStatus.GENERATING]: 'Generando',
  [ClinicalRecommendationStatus.PENDING_REVIEW]: 'Pendiente de revisión',
  [ClinicalRecommendationStatus.CONFIRMED]: 'Confirmada',
  [ClinicalRecommendationStatus.FAILED]: 'Requiere atención',
};

const DOMAIN_LABELS: Record<RecommendationOutput['findings'][number]['domain'], string> = {
  inflamatorio: 'Inflamatorio',
  metabolico: 'Metabólico',
  hepatico: 'Hepático',
  lipidico: 'Lipídico',
  hormonal: 'Hormonal',
  hematologico: 'Hematológico',
  otro: 'Otro',
};

const SEVERITY_LABELS: Record<RecommendationOutput['findings'][number]['severity'], string> = {
  normal: 'Normal',
  atencion: 'Atención',
  alto: 'Alto',
  incierto: 'Incierto',
};

export function formatRecommendationStatus(status: ClinicalRecommendationStatus) {
  return STATUS_LABELS[status];
}

export function formatFindingDomain(domain: RecommendationOutput['findings'][number]['domain']) {
  return DOMAIN_LABELS[domain];
}

export function formatFindingSeverity(
  severity: RecommendationOutput['findings'][number]['severity'],
) {
  return SEVERITY_LABELS[severity];
}

export function severityBadgeClass(
  severity: RecommendationOutput['findings'][number]['severity'],
) {
  switch (severity) {
    case 'normal':
      return 'badge-status-active';
    case 'atencion':
      return 'border border-amber-200 bg-amber-50 text-amber-900';
    case 'alto':
      return 'border border-red-200 bg-red-50 text-red-800';
    case 'incierto':
      return 'badge-status-inactive';
  }
}
