import { ClipboardList, FlaskConical, Lightbulb } from 'lucide-react';
import { Link, useOutletContext } from 'react-router';

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
        <div className="rounded-lg bg-cyan-50 px-4 py-6">
          <p className="text-sm font-semibold text-cyan-950">Informes de sangre</p>
          <p className="mt-1 text-sm text-slate-500">
            Sube un PDF, revisa los valores extraídos y confírmalos en la historia clínica.
          </p>
          <Link
            to={`/provider/patients/${patient.id}/labs`}
            className="mt-4 inline-flex font-semibold text-cyan-600 hover:text-cyan-800"
          >
            Ver laboratorios →
          </Link>
        </div>
      </PatientSection>

      <PatientSection
        title="Recomendaciones"
        description="Interpretación clínica y plan de estilo de vida basados en laboratorios confirmados."
        icon={Lightbulb}
      >
        <div className="rounded-lg bg-cyan-50 px-4 py-6">
          <p className="text-sm font-semibold text-cyan-950">Medicina funcional</p>
          <p className="mt-1 text-sm text-slate-500">
            Genera recomendaciones a partir de un laboratorio confirmado. Puedes editar el prompt
            en cada generación.
          </p>
          <Link
            to={`/provider/patients/${patient.id}/recommendations`}
            className="mt-4 inline-flex font-semibold text-cyan-600 hover:text-cyan-800"
          >
            Ver recomendaciones →
          </Link>
        </div>
      </PatientSection>
    </div>
  );
}
