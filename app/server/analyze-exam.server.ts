import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import z from 'zod';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ExamAnalysisResult = z.object({
  date: z.string(),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        currentRange: z
          .object({
            min: z.number(),
            max: z
              .number()
              .nullable()
              .describe('Si hay solo un valor encontrado, deja el max en null.'),
          })
          .describe(
            'Los parámetros del laboratorio reportados. Si hay solo un valor expresado (eg 42 mg/dL), expresa el min y deja el max en null.',
          ),
        laboratoryRange: z
          .object({
            min: z.number(),
            max: z.number().nullable(),
          })
          .describe(
            'Los parámetros de referencia del laboratorio. Si es solo uno, solo expresa el min.',
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
  analysis: z.array(z.string()).describe(
    `Luego el análisis, aclarando los resultados de la analítica en comparación a los parámetros,
       expresa cada punto analizado en un array de strings. Si se encuentra un area dentro de la normalidad,
       no es necesario mencionarlo a menos que solamente tenga 2 puntos por mencionar.
       El objetivo de añadir un valor en normalidad es evitar alucionanciones si se encuentra menos de 3 puntos
       que sean criticos. Que sean los 3 puntos más importantes y maximo 5 puntos si es necesario.
       Si todo esta en normalidad, decir que todo esta en normalidad.
       Ejemplo: "El parámetro [nombre del parámetro] está [valor] [unidad], lo cual es [interpretación]."`,
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
export interface Medication {
  name: string;
  startingDate: string;
  dose: number;
  frequency: string;
}

interface AnalyzeExamParams {
  exam: File;
  isTakingMedication?: boolean;
  additionalInfo?: string;
  medications?: Medication[];
}

const systemPrompt = `
  Eres medico investigador, especializado en medicina funcional, medicina de estilos de vida y longevidad. Usa íconos de emojis para expresar o enfatizar los objetivos/recomendaciones.
  Ejemplo:
  - 🐟: Si hay recomendación de comer pescado, usar un ícono así.
  - 💤: Si hay recomendación de dormir bien, usar un ícono así.
`;

export async function analyzeExam({
  exam,
  isTakingMedication,
  medications,
  additionalInfo,
}: AnalyzeExamParams) {
  const uploadedFile = await client.files.create({
    file: exam,
    purpose: 'assistants',
  });

  // Build medication context text
  let medicationContext = '';
  if (isTakingMedication && medications && medications.length > 0) {
    const medicationList = medications
      .map(
        (med) =>
          `- ${med.name}: Dosis ${med.dose}, Frecuencia: ${med.frequency}, Fecha de inicio: ${med.startingDate}`,
      )
      .join('\n');
    medicationContext = `\n\nEl paciente está tomando los siguientes medicamentos:\n${medicationList}\n\nConsidera estos medicamentos al analizar los resultados del examen, ya que pueden afectar los valores de los parámetros.`;
  }

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
              ${medicationContext}
              ${additionalInfo ? `\n\nInformación adicional: ${additionalInfo}` : ''}
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
