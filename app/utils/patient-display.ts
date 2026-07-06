import { IdentificationType, Sex } from '~/db/models/enums';

export const IDENTIFICATION_TYPE_OPTIONS = [
  { value: IdentificationType.CC, label: 'Cédula de ciudadanía' },
  { value: IdentificationType.TI, label: 'Tarjeta de identidad' },
  { value: IdentificationType.CE, label: 'Cédula de extranjería' },
  { value: IdentificationType.PA, label: 'Pasaporte' },
] as const;

export const SEX_OPTIONS = [
  { value: Sex.MALE, label: 'Masculino' },
  { value: Sex.FEMALE, label: 'Femenino' },
  { value: Sex.INTERSEX, label: 'Intersexual' },
  { value: Sex.UNKNOWN, label: 'Desconocido' },
] as const;

type PatientNameFields = {
  firstName: string;
  secondName?: string | null;
  firstLastName: string;
  secondLastName?: string | null;
};

// Formats a patient's full name for display.
export function formatPatientName(patient: PatientNameFields) {
  return [patient.firstName, patient.secondName, patient.firstLastName, patient.secondLastName]
    .filter(Boolean)
    .join(' ');
}

// Formats an identification type enum value for display.
export function formatIdentificationType(type: IdentificationType) {
  return IDENTIFICATION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

// Formats a sex enum value for display.
export function formatSex(sex: Sex | null | undefined) {
  if (!sex) {
    return '—';
  }

  return SEX_OPTIONS.find((option) => option.value === sex)?.label ?? sex;
}
