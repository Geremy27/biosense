import type { IdentificationType, Sex } from '~/db/models/enums';
import {
  formatIdentification,
  formatPatientName,
  formatSex,
  formatMeasurement,
} from '~/utils/patient-display';

type PatientSummaryPatient = {
  identificationType: IdentificationType;
  identificationNumber: string;
  firstName: string;
  secondName?: string | null;
  firstLastName: string;
  secondLastName?: string | null;
  birthDate: string;
  birthPlace: string;
  residencePlace: string;
  residenceRegionName?: string | null;
  phone: string;
  email?: string | null;
  sex?: Sex | null;
  ethnicity?: string | null;
  heightCm?: string | null;
  weightKg?: string | null;
};

type PatientSummaryProps = {
  patient: PatientSummaryPatient;
};

type SummaryField = {
  label: string;
  value: string;
};

// Renders read-only patient demographics on the view page.
export function PatientSummary({ patient }: PatientSummaryProps) {
  const fields: SummaryField[] = [
    {
      label: 'Identificación',
      value: formatIdentification(patient.identificationType, patient.identificationNumber),
    },
    {
      label: 'Fecha de nacimiento',
      value: new Date(`${patient.birthDate}T00:00:00`).toLocaleDateString('es-CO'),
    },
    { label: 'Lugar de nacimiento', value: patient.birthPlace },
    { label: 'Ciudad / región', value: patient.residenceRegionName ?? '—' },
    { label: 'Detalle de residencia', value: patient.residencePlace },
    { label: 'Teléfono', value: patient.phone },
    { label: 'Correo electrónico', value: patient.email ?? '—' },
    { label: 'Sexo', value: formatSex(patient.sex) },
    { label: 'Etnia', value: patient.ethnicity ?? '—' },
    { label: 'Altura', value: formatMeasurement(patient.heightCm, 'cm') ?? '—' },
    { label: 'Peso', value: formatMeasurement(patient.weightKg, 'kg') ?? '—' },
  ];

  return (
    <section className="card">
      <h3 className="text-lg font-semibold text-cyan-950">Datos del paciente</h3>
      <p className="mt-1 text-sm text-slate-500">{formatPatientName(patient)}</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm text-slate-700">{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
