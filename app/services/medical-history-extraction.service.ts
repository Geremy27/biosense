import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const extractedTextField = z
  .string()
  .nullable()
  .describe('Verbatim text from the document. Null when the topic is not mentioned at all.');

const extractedDatedItemSchema = z.object({
  label: z.string(),
  detail: z.string().nullable(),
  from: z
    .string()
    .nullable()
    .describe('YYYY-MM-DD start date when explicitly present, else null'),
  to: z
    .string()
    .nullable()
    .describe('YYYY-MM-DD end date when explicitly present; null means ongoing/present'),
});

const extractedDatedItemsField = z
  .array(extractedDatedItemSchema)
  .nullable()
  .describe('List of dated items. Null or empty when the topic is not mentioned.');

const extractedMedicalHistorySchema = z.object({
  isClinicalDocument: z.boolean(),
  classificationReason: z.string().nullable(),
  title: z.string().nullable(),
  recordedAt: z.string().nullable(),
  chiefComplaint: extractedTextField,
  personalHistory1: extractedDatedItemsField,
  personalHistory2: extractedDatedItemsField,
  surgicalHistory: extractedDatedItemsField,
  medications: extractedDatedItemsField,
  supplements: extractedDatedItemsField,
  diet: extractedDatedItemsField,
  infectiousHistory: extractedTextField,
  traumaticHistory: extractedTextField,
  toxicologicalHistory: extractedDatedItemsField,
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
              '- chiefComplaint: motivo de consulta (free text).',
              'For these fields return an array of {label, detail, from, to} (from/to as YYYY-MM-DD or null). If a date is missing, set from to null (the app will fill recordedAt). to null means still ongoing:',
              '- personalHistory1: diagnósticos personales ya confirmados.',
              '- personalHistory2: diagnósticos personales en estudio.',
              '- surgicalHistory: antecedentes quirúrgicos.',
              '- medications: medicamentos (label=nombre, detail=dosis/frecuencia).',
              '- supplements: suplementos (label=nombre, detail=dosis/frecuencia).',
              '- diet: alimentación o dietas relevantes.',
              '- toxicologicalHistory: tabaco/alcohol/otras sustancias (detail=cantidad/frecuencia).',
              'Free-text fields (string or null):',
              '- infectiousHistory, traumaticHistory, allergies, vaccines, habits, gynecoObstetricHistory, familyHistory, psychosocialHistory, notes.',
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
