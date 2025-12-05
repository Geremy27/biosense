import { useFetcher } from 'react-router';
import type { Route } from './+types/home';
import { analyzeExam } from '~/server/analyze-exam.server';
import { FileUpload } from '~/components/file-upload';
import { MedicationInput } from '~/components/medication-input';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Biosense' }, { name: 'description', content: 'Biosense' }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const file = formData.get('pdf') as File | null;
  const additionalInfo = formData.get('additional_info') as string | null;
  const isTakingMedication = formData.get('is_taking_medication') === 'true';

  // Extract medications array from JSON
  let medications: Array<{
    name: string;
    startingDate: string;
    dose: number;
    frequency: string;
  }> = [];

  if (isTakingMedication) {
    const medicationsJson = formData.get('medications') as string;
    if (medicationsJson) {
      try {
        medications = JSON.parse(medicationsJson);
      } catch (e) {
        console.error('Error parsing medications:', e);
      }
    }
  }

  if (typeof file === 'string' || !file) {
    return { error: 'No se envió archivo.' };
  }

  const result = await analyzeExam({
    exam: file,
    additionalInfo: additionalInfo || undefined,
    isTakingMedication,
    medications: isTakingMedication ? medications : undefined,
  });

  return result;
}

// Helper function to extract icon and text from recommendation string
function extractIconAndText(recommendation: string): { icon: string; text: string } {
  // Extract emoji or special character from the start of the string
  const emojiRegex =
    /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;
  const match = recommendation.match(emojiRegex);
  let icon = '💡';
  let text = recommendation;

  if (match) {
    icon = match[0];
    text = recommendation.slice(match[0].length).trim();
  } else {
    // If no emoji, try to extract first character and check if it's a special char
    const firstChar = recommendation.charAt(0);
    // If it's a common special character that might not render, use fallback
    if (firstChar && firstChar !== ' ' && firstChar.charCodeAt(0) > 127) {
      // Check if it's a known special character that might not render
      const specialChars = ['◆', '●', '■', '▲', '★', '☆', '•', '▪', '▫'];
      if (specialChars.includes(firstChar)) {
        icon = '💡';
        text = recommendation.slice(1).trim();
      } else {
        icon = firstChar;
        text = recommendation.slice(1).trim();
      }
    } else if (firstChar && firstChar !== ' ') {
      icon = firstChar;
      text = recommendation.slice(1).trim();
    }
  }

  return { icon, text };
}

export default function Home() {
  const fetcher = useFetcher();

  const isLoading = fetcher.state === 'submitting';

  return (
    <div className="flex flex-col h-screen bg-gray-900 py-4 px-4 sm:py-8 sm:px-8 overflow-y-auto min-h-0">
      <span className="text-white text-2xl sm:text-4xl font-semibold">Biosense</span>
      <fetcher.Form
        encType="multipart/form-data"
        method="post"
        className="flex py-4 h-full flex-col gap-4"
      >
        <FileUpload name="pdf" />
        <input
          type="text"
          name="additional_info"
          placeholder="Información adicional (eg. medicamentos, tratamientos, etc.)"
          className="flex p-2 border border-white rounded-md text-sm ring-0 outline-none"
          defaultValue={''}
        />

        <MedicationInput />

        <button
          type="submit"
          disabled={isLoading}
          className="bg-cyan-400 text-gray-900 font-semibold rounded-lg text-sm hover:opacity-80 px-4 py-2 w-full sm:w-48"
        >
          {isLoading ? 'Cargando...' : 'Subir'}
        </button>
        {fetcher.data && (
          <div className="flex flex-col gap-6 pb-8">
            {/* Resultados Section */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Resultados</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 pb-4 border-b border-gray-700">
                  <span className="text-base sm:text-lg font-medium text-gray-300">Fecha</span>
                  <span className="text-sm text-white">{fetcher.data.date}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-base sm:text-lg font-medium text-gray-300">
                    Datos del examen
                  </span>

                  {/* Mobile: Card Layout */}
                  <div className="flex flex-col gap-3 md:hidden max-h-96 overflow-y-auto">
                    {fetcher.data.parameters.map(
                      (parameter: {
                        name: string;
                        unit: string;
                        currentRange: { min: number; max: number };
                        laboratoryRange: { min: number; max: number };
                        optimalRange: { min: number; max: number };
                        valuation: string;
                      }) => (
                        <div
                          key={parameter.name}
                          className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-semibold text-base">
                                {parameter.name}
                              </span>
                              <span className="text-gray-400 text-sm">{parameter.unit}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Valor Actual:</span>
                                <span className="text-white ml-2">
                                  {parameter.currentRange.min}
                                  {parameter.currentRange.max
                                    ? ` - ${parameter.currentRange.max}`
                                    : ''}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Valor Lab:</span>
                                <span className="text-white ml-2">
                                  {parameter.laboratoryRange.min}
                                  {parameter.laboratoryRange.max
                                    ? ` - ${parameter.laboratoryRange.max}`
                                    : ''}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Valor Óptimo:</span>
                                <span className="text-white ml-2">
                                  {parameter.optimalRange.min}
                                  {parameter.optimalRange.max
                                    ? ` - ${parameter.optimalRange.max}`
                                    : ''}
                                </span>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-gray-700">
                              <span className="text-gray-400 text-sm">Interpretación:</span>
                              <p className="text-white text-sm mt-1">{parameter.valuation}</p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Desktop: Table Layout */}
                  <div className="hidden md:block rounded-md text-sm overflow-x-auto">
                    <div className="flex flex-col min-w-fit">
                      <div className="flex bg-gray-900 px-4 py-2">
                        <span className="flex w-72 p-2">Parámetros</span>
                        <span className="flex w-48 p-2">Unidad</span>
                        <span className="flex w-48 p-2">Valor Actual</span>
                        <span className="flex w-48 p-2">Valor de Laboratorio</span>
                        <span className="flex w-48 p-2">Valor Óptimo</span>
                        <span className="flex w-48 p-2">Interpretación</span>
                      </div>
                      <div className="flex flex-col h-96 overflow-y-auto">
                        {fetcher.data.parameters.map(
                          (parameter: {
                            name: string;
                            unit: string;
                            currentRange: { min: number; max: number };
                            laboratoryRange: { min: number; max: number };
                            optimalRange: { min: number; max: number };
                            valuation: string;
                          }) => (
                            <div
                              key={parameter.name}
                              className="flex py-2 hover:bg-gray-700 border-b border-gray-700 px-4"
                            >
                              <span className="flex w-72 p-2">{parameter.name}</span>
                              <span className="flex w-48 p-2">{parameter.unit}</span>
                              <span className="flex w-48 p-2">
                                {parameter.currentRange.min}{' '}
                                {parameter.currentRange.max
                                  ? `- ${parameter.currentRange.max}`
                                  : ''}
                              </span>
                              <span className="flex w-48 p-2">
                                {parameter.laboratoryRange.min}{' '}
                                {parameter.laboratoryRange.max
                                  ? `- ${parameter.laboratoryRange.max}`
                                  : ''}
                              </span>
                              <span className="flex w-48 p-2">
                                {parameter.optimalRange.min}{' '}
                                {parameter.optimalRange.max
                                  ? `- ${parameter.optimalRange.max}`
                                  : ''}
                              </span>
                              <span className="flex w-48 p-2">{parameter.valuation}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis Section */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Análisis</h2>
              <div className="flex flex-col text-sm gap-3">
                {fetcher.data.analysis.map((analysis: string, index: number) => (
                  <div key={index} className="text-white">
                    <span className="text-cyan-400 font-medium">{index + 1}.</span> {analysis}
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendaciones Nutricionales Section */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Recomendaciones Nutricionales
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {fetcher.data.nutritionalRecommendations.map(
                  (recommendation: string, index: number) => {
                    const { icon, text } = extractIconAndText(recommendation);
                    return (
                      <div
                        key={index}
                        className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex flex-col items-center gap-3 hover:border-cyan-400/50 hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl">{icon}</span>
                        </div>
                        <p className="text-white text-xs sm:text-sm text-center leading-tight break-words hyphens-auto">
                          {text}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Recomendaciones de Ejercicio Section */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Recomendaciones de Ejercicio
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {fetcher.data.exerciseRecommendations.map(
                  (recommendation: string, index: number) => {
                    const { icon, text } = extractIconAndText(recommendation);
                    return (
                      <div
                        key={index}
                        className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex flex-col items-center gap-3 hover:border-cyan-400/50 hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl">{icon}</span>
                        </div>
                        <p className="text-white text-xs sm:text-sm text-center leading-tight break-words hyphens-auto">
                          {text}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Recomendaciones de Sueño Section */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Recomendaciones de Sueño
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {fetcher.data.sleepRecommendations.map((recommendation: string, index: number) => {
                  const { icon, text } = extractIconAndText(recommendation);
                  return (
                    <div
                      key={index}
                      className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex flex-col items-center gap-3 hover:border-cyan-400/50 hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl">{icon}</span>
                      </div>
                      <p className="text-white text-xs sm:text-sm text-center leading-tight">
                        {text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recomendaciones de Suplementos Section */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Recomendaciones de Suplementos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {fetcher.data.supplementRecommendations.map(
                  (recommendation: string, index: number) => {
                    const { icon, text } = extractIconAndText(recommendation);
                    return (
                      <div
                        key={index}
                        className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex flex-col items-center gap-3 hover:border-cyan-400/50 hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl">{icon}</span>
                        </div>
                        <p className="text-white text-xs sm:text-sm text-center leading-tight break-words hyphens-auto">
                          {text}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}
