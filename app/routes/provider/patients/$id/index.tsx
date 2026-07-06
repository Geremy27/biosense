import { ClipboardList, FlaskConical } from 'lucide-react';
import { useOutletContext } from 'react-router';

import { PatientSection } from '~/components/patients/patient-section';
import { PatientSummary } from '~/components/patients/patient-summary';

import type { PatientOutletContext } from './patient-outlet-context';

export default function PatientView() {
  const { patient } = useOutletContext<PatientOutletContext>();

  return (
    <div className="space-y-6">
      <PatientSummary patient={patient} />

      <PatientSection
        title="Consultas anteriores"
        description="Historial de consultas y casos clínicos del paciente."
        icon={ClipboardList}
      >
        <div className="rounded-lg bg-slate-100 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-500">Próximamente</p>
          <p className="mt-1 text-sm text-slate-400">
            Aquí podrás ver consultas previas, diagnósticos y notas clínicas.
          </p>
        </div>
      </PatientSection>

      <PatientSection
        title="Laboratorios"
        description="Resultados de exámenes y estudios de laboratorio."
        icon={FlaskConical}
      >
        <div className="rounded-lg bg-slate-100 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-500">Próximamente</p>
          <p className="mt-1 text-sm text-slate-400">
            Aquí podrás consultar resultados de laboratorio y estudios complementarios.
          </p>
        </div>
      </PatientSection>
    </div>
  );
}
