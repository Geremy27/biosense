import { Form, useFetcher } from 'react-router';
import type { Route } from './+types/home';
import { analyzeExam } from '~/server/analyze-exam.server';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Biosense' }, { name: 'description', content: 'Biosense' }];
}

const defaultPrompt = `Analiza todo el examen y extrae toda la información. Siempre muy honesto, detallado y preciso.
Es mejor decir la verdad que ocultar algo no favorable, estas revisando la salud de un paciente.
Primero expresa los todos los valores de manera que se asemejen a una tabla y utilizando colores, lo vas a expresar así:
Todos los valores (El color antes de los valores, en color automático de acuerdo a los rangos óptimos respecto a edad y sexo;
importantisimo la honestidad y veracidad de esto); Todos los parámetros del laboratorio reportados (la fuente de los números en color amarillo);
y los parámetros óptimos/ideales de acuerdo a lo hallazgos mas reciente referentes al sexo y edad (la fuente de los números en color verde).
Adicionalmente expresa diferentes parámetros inflamatorios y metabólicos que se puedan obtener con los laboratorios reportados del mismo día.
Luego el análisis, aclarando los resultados de la analítica en comparación a los parámetros,
y finaliza con sugerencias en el estilo de vida, dividida y expresada así:
Nutricional, expresa las recomendaciones en gramos y tazas, al igual que frecuencia diaria y semanal de todo;
Ejercicio, expresa la intensidad y como saberlo de manera sencilla, como si le estuviéras explicando a una persona sin educación superior, la frecuencia semanal y la duración diaria;
Mental y Sueño, recalca la importancia y como poder ser consiente si se hace bien o no.
Después expresa de 1 a máximo 3 recomendaciones de suplementos
(Asociados con el estilo de vida sugerido, que sean los más eficientes e idóneos, tomando en cuenta los análisis de laboratorio, la estructura de medicina funcional y la evidencia científica actual),
con dosificación. Si se requiere mas información para poder recomendar algo, exprésalo y no lo recomiendes).
No ofrezcas más ayuda, únicamente la recomendación de asistir a los profesionales de la salud idóneos.
`;

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
    prompt: prompt ? prompt + addToPrompt : '',
  });

  return result;
}

export default function Home() {
  const fetcher = useFetcher();

  const isLoading = fetcher.state === 'submitting';

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 p-8">
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
        <textarea
          name="prompt"
          placeholder="Prompt"
          className="flex p-2 h-48 border border-white rounded-md"
          defaultValue={defaultPrompt}
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
          <div className="flex flex-col gap-4">
            <span className="text-lg">Resultado</span>
            <div className="flex flex-grow">
              <p className="text-white whitespace-pre-wrap h-96 overflow-y-auto bg-gray-800 p-4 rounded-md border border-white">
                {fetcher.data}
              </p>
            </div>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}
