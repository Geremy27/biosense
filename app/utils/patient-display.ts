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

// Formats an identification type enum value for display (full label — forms, etc.).
export function formatIdentificationType(type: IdentificationType) {
  return IDENTIFICATION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

// Formats an identification type as its abbreviation (CC, TI, CE, PA).
export function formatIdentificationAbbreviation(type: IdentificationType) {
  return type;
}

// Formats identification type + number for tables and read-only views.
export function formatIdentification(type: IdentificationType, number: string) {
  return `${formatIdentificationAbbreviation(type)} ${number}`;
}

// Formats a sex enum value for display.
export function formatSex(sex: Sex | null | undefined) {
  if (!sex) {
    return '—';
  }

  return SEX_OPTIONS.find((option) => option.value === sex)?.label ?? sex;
}

export function calculateAgeYears(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
}

export function formatMeasurement(value: string | null | undefined, unit: string) {
  if (!value) {
    return null;
  }

  return `${value} ${unit}`;
}

export function formatBmi(heightCm: string | null | undefined, weightKg: string | null | undefined) {
  const height = heightCm ? Number(heightCm) : null;
  const weight = weightKg ? Number(weightKg) : null;

  if (!height || !weight || height <= 0) {
    return null;
  }

  return String(Math.round((weight / (height / 100) ** 2) * 10) / 10);
}
