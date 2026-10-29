import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import { FUNCTIONAL_MEDICINE_OPTIMAL_RANGES_TEXT } from '~/knowledge/functional-medicine-optimal-ranges';

const extractedLabSchema = z.object({
  isBloodwork: z.boolean(),
  classificationReason: z.string().nullable(),
  labName: z.string().nullable(),
  panelName: z.string().nullable(),
  collectedAt: z.string().nullable(),
  analytes: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      unit: z.string().nullable(),
      referenceRange: z.string().nullable(),
      optimalRange: z.string().nullable(),
      flag: z.string().nullable(),
    }),
  ),
});

export type ExtractedLab = z.infer<typeof extractedLabSchema>;

export async function extractLabFromPdf(
  pdf: Buffer,
  filename: string,
): Promise<ExtractedLab & { model: string }> {
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
        content: [
          'You extract clinical laboratory data accurately. Never infer, calculate, translate, or invent a value, unit, range, flag, date, or name. Preserve decimal separators and comparison symbols exactly as printed. Use null when information is absent.',
          '',
          'After extracting each analyte from the PDF, look it up in the FUNCTIONAL MEDICINE OPTIMAL RANGES table provided in the user message.',
          'Set optimalRange to the matching optimal range string from that table (e.g. "80–87 mg/dL").',
          'Set flag based on the patient\'s result compared to the optimal range:',
          '  - If the value is clearly outside the optimal range but within the conventional reference range printed on the report, set flag to "SUBÓPTIMO".',
          '  - If the value is outside both the optimal range and the printed reference range, set flag to "FUERA DE RANGO ÓPTIMO".',
          '  - If the value is within the optimal range, set flag to null.',
          '  - If the optimal range is not found in the table, fall back to the flag printed on the report (e.g. "H", "L", "*"), or null if none.',
          'When the table has separate entries for male/female and the patient sex is not known from the report, use the general entry or leave optimalRange as the range without gender qualifier.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Determine whether this document is a bloodwork laboratory report.',
              'If it is, extract every reported analyte row.',
              'referenceRange is the laboratory range printed on the report.',
              'optimalRange must be filled from the FUNCTIONAL MEDICINE OPTIMAL RANGES table below whenever a matching analyte is found; otherwise use a range explicitly labeled as optimal in the report, or null.',
              'flag must reflect the optimal-range assessment as instructed in the system prompt.',
              'Use YYYY-MM-DD for collectedAt when the collection date is clearly present; otherwise null.',
              'If it is not bloodwork, return an empty analytes array and explain why in Spanish in classificationReason.',
              '',
              '---',
              '',
              FUNCTIONAL_MEDICINE_OPTIMAL_RANGES_TEXT,
            ].join('\n'),
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
      format: zodTextFormat(extractedLabSchema, 'bloodwork_lab_report'),
    },
  });

  if (!response.output_parsed) {
    throw new Error('The model did not return structured lab data');
  }

  return { ...response.output_parsed, model };
}
