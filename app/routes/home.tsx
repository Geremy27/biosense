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

  if (typeof file === 'string' || !file) {
    return { error: 'No se envió archivo.' };
  }

  const result = await analyzeExam({ exam: file, prompt: prompt || '' });
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
          type="text"
          name="prompt"
          placeholder="Prompt"
          className="flex p-2 border border-white rounded-md"
          defaultValue={
            'Analiza el examen y extrae la información. Primero di los valores de los parámetros del examen y luego el análisis.'
          }
        />
        <input
          type="file"
          name="pdf"
          accept="application/pdf"
          className="flex text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-cyan-400 text-white px-4 py-2 rounded-md cursor-pointer w-48"
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
