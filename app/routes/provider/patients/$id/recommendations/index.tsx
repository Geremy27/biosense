import { Lightbulb, Sparkles } from 'lucide-react';
import { Link, useOutletContext } from 'react-router';

import { EmptyState } from '~/components/ui/empty-state';
import { StatusBadge } from '~/components/ui/status-badge';
import { ClinicalRecommendationStatus } from '~/db/models/enums';
import { listClinicalRecommendations } from '~/services/clinical-recommendations.service';
import { formatRecommendationStatus } from '~/utils/recommendation-display';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/index';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  return { recommendations: await listClinicalRecommendations(ctx, params.id) };
}

export default function PatientRecommendations({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Historia clínica</p>
          <h2 className="mt-1 text-2xl font-bold text-cyan-950">Recomendaciones</h2>
          <p className="mt-2 text-sm text-slate-500">
            Interpretaciones clínicas basadas en laboratorios confirmados.
          </p>
        </div>
        <Link to="new" className="btn-primary gap-2">
          <Sparkles className="size-4" aria-hidden />
          Generar
        </Link>
      </div>

      {loaderData.recommendations.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No hay recomendaciones"
          description="Genera la primera a partir de un laboratorio confirmado."
          action={
            <Link to="new" className="btn-primary">
              Generar recomendación
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="data-table">
            <thead className="data-table-head">
              <tr>
                <th className="data-table-th">Fecha</th>
                <th className="data-table-th">Estado</th>
                <th className="data-table-th">Modelo</th>
                <th className="data-table-th text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loaderData.recommendations.map((recommendation) => (
                <tr key={recommendation.id} className="data-table-row">
                  <td className="data-table-td">
                    {new Intl.DateTimeFormat('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(recommendation.createdAt))}
                  </td>
                  <td className="data-table-td">
                    <StatusBadge
                      label={formatRecommendationStatus(recommendation.status)}
                      variant={
                        recommendation.status === ClinicalRecommendationStatus.CONFIRMED
                          ? 'active'
                          : 'inactive'
                      }
                    />
                  </td>
                  <td className="data-table-td">{recommendation.model}</td>
                  <td className="data-table-td text-right">
                    <Link
                      to={`/provider/patients/${patient.id}/recommendations/${recommendation.id}`}
                      className="font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      {recommendation.status === ClinicalRecommendationStatus.PENDING_REVIEW
                        ? 'Revisar'
                        : 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
