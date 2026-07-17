import { FilePenLine } from 'lucide-react';
import { Link } from 'react-router';

import { pageTitle } from '~/brand';
import { EmptyState } from '~/components/ui/empty-state';
import { PageHeader } from '~/components/ui/page-header';
import { StatusBadge } from '~/components/ui/status-badge';
import {
  ensureDefaultRecommendationPrompt,
  listRecommendationPrompts,
} from '~/services/recommendation-prompts.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  await ensureDefaultRecommendationPrompt(ctx.userId);
  return { prompts: await listRecommendationPrompts(ctx) };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: pageTitle('Prompts de recomendación') }];
}

export default function RecommendationPromptsIndex({ loaderData }: Route.ComponentProps) {
  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Administración"
        title="Prompts de recomendación"
      />

      {loaderData.prompts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FilePenLine}
            title="No hay prompts"
            description="Ejecuta el seed de prompts para crear la versión inicial."
          />
        </div>
      ) : (
        <div className="mt-8 card overflow-x-auto p-0">
          <table className="data-table">
            <thead className="data-table-head">
              <tr>
                <th className="data-table-th">Nombre</th>
                <th className="data-table-th">Slug</th>
                <th className="data-table-th">Modelo</th>
                <th className="data-table-th">Estado</th>
                <th className="data-table-th text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loaderData.prompts.map((prompt) => (
                <tr key={prompt.id} className="data-table-row">
                  <td className="data-table-td font-semibold text-cyan-950">{prompt.name}</td>
                  <td className="data-table-td">{prompt.slug}</td>
                  <td className="data-table-td">{prompt.model}</td>
                  <td className="data-table-td">
                    <StatusBadge
                      label={prompt.isActive ? 'Activo' : 'Inactivo'}
                      variant={prompt.isActive ? 'active' : 'inactive'}
                    />
                  </td>
                  <td className="data-table-td text-right">
                    <Link
                      to={`/admin/recommendation-prompts/${prompt.id}`}
                      className="font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
