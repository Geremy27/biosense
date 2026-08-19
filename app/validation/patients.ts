import { z } from 'zod';

import { IdentificationType, Sex } from '~/db/models/enums';

const identificationTypes = [
  IdentificationType.CC,
  IdentificationType.TI,
  IdentificationType.CE,
  IdentificationType.PA,
] as const;

const sexValues = [Sex.MALE, Sex.FEMALE, Sex.INTERSEX, Sex.UNKNOWN] as const;

// Normalizes optional text fields from HTML forms into null when empty.
function optionalText() {
  return z
    .string()
    .transform((value) => {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    })
    .nullable();
}

// Validates optional positive numeric strings from HTML forms.
function optionalPositiveNumber(fieldLabel: string) {
  return z
    .string()
    .transform((value) => {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    })
    .nullable()
    .refine((value) => value === null || (!Number.isNaN(Number(value)) && Number(value) > 0), {
      message: `${fieldLabel} debe ser un número mayor que cero.`,
    });
}

export const patientInputSchema = z.object({
  identificationType: z.enum(identificationTypes, {
    message: 'Selecciona un tipo de identificación.',
  }),
  identificationNumber: z
    .string()
    .trim()
    .min(1, 'El número de identificación es obligatorio.'),
  firstName: z.string().trim().min(1, 'El primer nombre es obligatorio.'),
  secondName: optionalText(),
  firstLastName: z.string().trim().min(1, 'El primer apellido es obligatorio.'),
  secondLastName: optionalText(),
  birthDate: z
    .string()
    .trim()
    .min(1, 'La fecha de nacimiento es obligatoria.')
    .refine(
      (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
      'Ingresa una fecha válida.',
    ),
  birthPlace: z.string().trim().min(1, 'El lugar de nacimiento es obligatorio.'),
  residencePlace: z.string().trim().min(1, 'El lugar de residencia es obligatorio.'),
  residenceRegionId: z.string().uuid({ message: 'Selecciona una ciudad/región de residencia.' }),
  phone: z.string().trim().min(7, 'El teléfono es obligatorio.'),
  email: z
    .string()
    .transform((value) => {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    })
    .nullable()
    .refine((value) => value === null || z.email().safeParse(value).success, {
      message: 'Ingresa un correo válido.',
    }),
  sex: z
    .string()
    .transform((value) => (value === '' ? null : value))
    .pipe(z.union([z.enum(sexValues), z.null()])),
  ethnicity: optionalText(),
  heightCm: optionalPositiveNumber('La estatura'),
  weightKg: optionalPositiveNumber('El peso'),
});

export type PatientInput = z.infer<typeof patientInputSchema>;

// Parses and validates patient form data from a request FormData payload.
export function parsePatientFormData(formData: FormData) {
  return patientInputSchema.safeParse({
    identificationType: String(formData.get('identificationType') ?? ''),
    identificationNumber: String(formData.get('identificationNumber') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    secondName: String(formData.get('secondName') ?? ''),
    firstLastName: String(formData.get('firstLastName') ?? ''),
    secondLastName: String(formData.get('secondLastName') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
    birthPlace: String(formData.get('birthPlace') ?? ''),
    residencePlace: String(formData.get('residencePlace') ?? ''),
    residenceRegionId: String(formData.get('residenceRegionId') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    sex: String(formData.get('sex') ?? ''),
    ethnicity: String(formData.get('ethnicity') ?? ''),
    heightCm: String(formData.get('heightCm') ?? ''),
    weightKg: String(formData.get('weightKg') ?? ''),
  });
}
