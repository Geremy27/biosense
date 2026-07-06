import type { getPatient } from '~/services/patients.service';

export type PatientOutletContext = {
  patient: NonNullable<Awaited<ReturnType<typeof getPatient>>>;
};
