import { Form, useFetcher } from 'react-router';
import type { Route } from './+types/home';
import { analyzeExam } from '~/server/analyze-exam.server';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Biosense' }, { name: 'description', content: 'Biosense' }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const file = formData.get('pdf') as File | null;
  const prompt = formData.get('prompt') as string | null;
  const additionalInfo = formData.get('additional_info') as string | null;

  if (typeof file === 'string' || !file) {
    return { error: 'No se envió archivo.' };
  }

  const addToPrompt = additionalInfo ? `\n\nInformación adicional: ${additionalInfo}` : '';

  const result = await analyzeExam({
    exam: file,
  });

  return result;
}

export default function Home() {
  const fetcher = useFetcher();

  const isLoading = fetcher.state === 'submitting';

  return (
    <div className="flex flex-col h-screen bg-gray-900 py-8 px-8 overflow-y-auto min-h-0">
      <span className="text-white text-4xl font-semibold">Biosense</span>
      <fetcher.Form
        encType="multipart/form-data"
        method="post"
        className="flex py-4 h-full flex-col gap-4"
      >
        <input
          type="file"
          name="pdf"
          accept="application/pdf"
          className="flex text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
        />
        <input
          type="text"
          name="additional_info"
          placeholder="Información adicional (eg. medicamentos, tratamientos, etc.)"
          className="flex p-2 border border-white rounded-md"
          defaultValue={''}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-cyan-400 text-white px-4 py-2 rounded-md w-48"
        >
          {isLoading ? 'Cargando...' : 'Subir'}
        </button>
        {fetcher.data && (
          <div className="flex flex-col gap-4 pb-8">
            <span className="text-2xl">Resultados</span>
            <div className="flex flex-col gap-2">
              <span className="text-lg font-medium">Fecha</span>
              <span className="text-sm">{fetcher.data.date}</span>
            </div>
            <span className="text-lg font-medium">Datos del examen</span>

            <div className="flex flex-col rounded-md text-sm">
              <div className="flex bg-gray-800 px-4 py-2">
                <span className="flex flex-1 pr-2">Parámetros</span>
                <span className="flex flex-1 pr-2">Unidad</span>
                <span className="flex flex-1 pr-2">Valor Actual</span>
                <span className="flex flex-1 pr-2">Valor de Laboratorio</span>
                <span className="flex flex-1 pr-2">Valor Óptimo</span>
                <span className="flex flex-[4]">Interpretación</span>
              </div>
              <div className="flex flex-col px-4">
                {fetcher.data.parameters.map(
                  (parameter: {
                    name: string;
                    unit: string;
                    currentRange: { min: number; max: number };
                    laboratoryRange: { min: number; max: number };
                    optimalRange: { min: number; max: number };
                    valuation: string;
                  }) => (
                    <div className="flex py-2">
                      <span className="flex flex-1 pr-2">{parameter.name}</span>
                      <span className="flex flex-1 pr-2">{parameter.unit}</span>
                      <span className="flex flex-1 pr-2">
                        {parameter.currentRange.min}{' '}
                        {parameter.currentRange.max ? `- ${parameter.currentRange.max}` : ''}
                      </span>
                      <span className="flex flex-1 pr-2">
                        {parameter.laboratoryRange.min}{' '}
                        {parameter.laboratoryRange.max ? `- ${parameter.laboratoryRange.max}` : ''}
                      </span>
                      <span className="flex flex-1 pr-2">
                        {parameter.optimalRange.min}{' '}
                        {parameter.optimalRange.max ? `- ${parameter.optimalRange.max}` : ''}
                      </span>
                      <span className="flex flex-[4]">{parameter.valuation}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
            <span className="text-lg font-medium">Análisis</span>
            <div className="flex flex-col text-sm gap-2">
              {fetcher.data.analysis.map((analysis: string, index: number) => (
                <span key={index}>
                  {index + 1}. {analysis}
                </span>
              ))}
            </div>
            <span className="text-lg font-medium">Recomendaciones Nutricionales</span>
            <div className="flex flex-col text-sm gap-2">
              {fetcher.data.nutritionalRecommendations.map(
                (recommendation: string, index: number) => (
                  <span key={index}>
                    {index + 1}. {recommendation}
                  </span>
                ),
              )}
            </div>
            <span className="text-lg font-medium">Recomendaciones de Ejercicio</span>
            <div className="flex flex-col text-sm gap-2">
              {fetcher.data.exerciseRecommendations.map((recommendation: string, index: number) => (
                <span key={index}>
                  {index + 1}. {recommendation}
                </span>
              ))}
            </div>
            <span className="text-lg font-medium">Recomendaciones de Sueño</span>
            <div className="flex flex-col text-sm gap-2">
              {fetcher.data.sleepRecommendations.map((recommendation: string, index: number) => (
                <span key={index}>
                  {index + 1}. {recommendation}
                </span>
              ))}
            </div>
            <span className="text-lg">Recomendaciones de Suplementos</span>
            <div className="flex flex-col text-sm gap-2">
              {fetcher.data.supplementRecommendations.map(
                (recommendation: string, index: number) => (
                  <span key={index}>
                    {index + 1}. {recommendation}
                  </span>
                ),
              )}
            </div>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}
