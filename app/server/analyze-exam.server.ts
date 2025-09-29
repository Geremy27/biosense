import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod.mjs';
import z from 'zod';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

enum ExamParameterValuation {
  GOOD = 'good',
  AVERAGE = 'average',
  BAD = 'bad',
  UNKOWN = 'unknown',
}

const ExamAnalysisResult = z.object({
  date: z.string(),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        currentRange: z
          .object({
            min: z.number(),
            max: z.number().nullable(),
          })
          .describe(
            'Los parámetros del laboratorio reportados. Si es solo uno, solo expresa el min.',
          ),
        optimalRange: z
          .object({
            min: z.number(),
            max: z.number().nullable(),
          })
          .describe(
            'Los parámetros óptimos/ideales de acuerdo a lo hallazgos mas reciente referentes al sexo y edad. Si es solo uno, solo expresa el min.',
          ),
        unit: z.string(),
        valuation: z.string().describe(''),
      }),
    )
    .describe(
      'Todos los valores (El color antes de los valores, en color automático de acuerdo a los rangos óptimos respecto a edad y sexo;',
    ),
  analysis: z
    .string()
    .describe(
      'Luego el análisis, aclarando los resultados de la analítica en comparación a los parámetros,',
    ),
  nutritionalRecommendations: z
    .array(z.string())
    .describe(
      'Expresa sugerencias nutricionales, expresadas en gramos y tazas, al igual que frecuencia diaria y semanal de todo;',
    ),
  exerciseRecommendations: z
    .array(z.string())
    .describe(
      'Expresa sugerencias de ejercicio, expresadas en la intensidad y como saberlo de manera sencilla, como si le estuviéras explicando a una persona sin educación superior, la frecuencia semanal y la duración diaria;',
    ),
  sleepRecommendations: z
    .array(z.string())
    .describe(
      'Expresa sugerencias de sueño y mentales, expresadas en la importancia y como poder ser consiente si se hace bien o no;',
    ),
  supplementRecommendations: z
    .array(z.string())
    .describe(
      'Expresa de 1 a máximo 3 recomendaciones de suplementos (Asociados con el estilo de vida sugerido, que sean los más eficientes e idóneos, tomando en cuenta los análisis de laboratorio, la estructura de medicina funcional y la evidencia científica actual)',
    ),
});
interface AnalyzeExamParams {
  exam: File;
}

const systemPrompt = `
  Eres medico investigador, especializado en medicina funcional, medicina de estilos de vida y longevidad.
`;

export async function analyzeExam({ exam }: AnalyzeExamParams) {
  const uploadedFile = await client.files.create({
    file: exam,
    purpose: 'assistants',
  });

  const response = await client.responses.parse({
    model: 'gpt-5',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: systemPrompt,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            file_id: uploadedFile.id,
          },
          {
            type: 'input_text',
            text: `
              Analiza todo el examen y extrae toda la información. Siempre muy honesto, detallado y preciso.
              Es mejor decir la verdad que ocultar algo no favorable, estas revisando la salud de un paciente.
            `,
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(ExamAnalysisResult, 'event'),
    },
    reasoning: {
      effort: 'low',
    },
  });

  const result = response.output_parsed;
  const parsedResult = ExamAnalysisResult.safeParse(result);

  if (!parsedResult.success) {
    throw new Error('No se pudo analizar el examen.');
  }

  return parsedResult.data;
}
