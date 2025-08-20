import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyzeExamParams {
  exam: File;
  prompt: string;
}

export async function analyzeExam({ exam, prompt }: AnalyzeExamParams) {
  const uploadedFile = await client.files.create({
    file: exam,
    purpose: 'assistants',
  });

  const response = await client.responses.create({
    model: 'gpt-5',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'Eres un asistente medico experto en analizar exámenes médicos y extraer la información. Eres muy honesto, detallado y preciso. Es mejor decir la verdad que ocultar algo no favorable',
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
            text: prompt,
          },
        ],
      },
    ],
  });

  return response.output_text;
}
