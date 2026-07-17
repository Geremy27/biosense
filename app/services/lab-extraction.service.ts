import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

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
        content:
          'You extract clinical laboratory data accurately. Never infer, calculate, translate, or invent a value, unit, range, flag, date, or name. Preserve decimal separators and comparison symbols exactly as printed. Use null when information is absent.',
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
              'optimalRange is only a range explicitly labeled as optimal; do not treat a normal/reference range as optimal.',
              'Use YYYY-MM-DD for collectedAt when the collection date is clearly present; otherwise null.',
              'If it is not bloodwork, return an empty analytes array and explain why in Spanish in classificationReason.',
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
      format: zodTextFormat(extractedLabSchema, 'bloodwork_lab_report'),
    },
  });

  if (!response.output_parsed) {
    throw new Error('The model did not return structured lab data');
  }

  return { ...response.output_parsed, model };
}
