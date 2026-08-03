import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const extractedTextField = z
  .string()
  .nullable()
  .describe('Verbatim text from the document. Null when the topic is not mentioned at all.');

const extractedMedicalHistorySchema = z.object({
  isClinicalDocument: z.boolean(),
  classificationReason: z.string().nullable(),
  title: z.string().nullable(),
  recordedAt: z.string().nullable(),
  chiefComplaint: extractedTextField,
  personalHistory1: extractedTextField,
  personalHistory2: extractedTextField,
  surgicalHistory: extractedTextField,
  medications: extractedTextField,
  supplements: extractedTextField,
  infectiousHistory: extractedTextField,
  traumaticHistory: extractedTextField,
  toxicologicalHistory: extractedTextField,
  allergies: extractedTextField,
  vaccines: extractedTextField,
  habits: extractedTextField,
  gynecoObstetricHistory: extractedTextField,
  familyHistory: extractedTextField,
  psychosocialHistory: extractedTextField,
  notes: extractedTextField,
});

export type ExtractedMedicalHistory = z.infer<typeof extractedMedicalHistorySchema>;

export async function extractMedicalHistoryFromPdf(
  pdf: Buffer,
  filename: string,
): Promise<ExtractedMedicalHistory & { model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  const client = new OpenAI({ apiKey });
  const response = await client.responses.parse({
    model,
    input: [
      {
        role: 'system',
        content:
          'You extract clinical history data from documents accurately. Never infer, calculate, translate, summarize away, or invent information that is not explicitly present. Use null when a topic is absent. Preserve dates, doses and quantities exactly as printed, but write field content in Spanish.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Determine whether this document is a clinical/medical history document (consultation note, intake form, medical record, epicrisis, etc).',
              'If it is, extract each of the following items ONLY when explicitly present in the document, verbatim in Spanish; otherwise use null:',
              '- title: a short descriptive title for this record (e.g. "Historia clínica inicial").',
              '- recordedAt: the date of the consultation/document in YYYY-MM-DD format if clearly present, else null.',
              '- chiefComplaint: motivo de consulta.',
              '- personalHistory1: diagnósticos personales ya confirmados, con fecha o hace cuánto tiempo.',
              '- personalHistory2: diagnósticos personales que están en estudio.',
              '- surgicalHistory: antecedentes quirúrgicos (procedimiento y fecha).',
              '- medications: medicamentos actuales (cuáles, dosis, fecha de inicio).',
              '- supplements: suplementos actuales (cuáles, dosis, fecha de inicio).',
              '- infectiousHistory: antecedentes infecciosos recurrentes.',
              '- traumaticHistory: antecedentes traumáticos físicos, emocionales o psicológicos.',
              '- toxicologicalHistory: tabaco/alcohol/otras sustancias, cantidad y frecuencia.',
              '- allergies: alergias conocidas a medicamentos o alimentos.',
              '- vaccines: vacunas de los últimos 5 años y número de dosis.',
              '- habits: hábitos urinarios/intestinales y características especiales.',
              '- gynecoObstetricHistory: antecedentes gineco-obstétricos (solo si el documento es de una paciente mujer).',
              '- familyHistory: antecedentes familiares (padres, abuelos).',
              '- psychosocialHistory: antecedentes psicosociales.',
              '- notes: cualquier otra nota clínica relevante que no encaje en los campos anteriores.',
              'If the document is not a clinical/medical history document, leave every item null and explain why in Spanish in classificationReason.',
            ].join(' '),
          },
          {
            type: 'input_file',
            filename,
            file_data: `data:application/pdf;base64,${pdf.toString('base64')}`,
            detail: 'high',
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(extractedMedicalHistorySchema, 'clinical_history_document'),
    },
  });

  if (!response.output_parsed) {
    throw new Error('The model did not return structured medical history data');
  }

  return { ...response.output_parsed, model };
}
