import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeExam(exam: File) {
  console.log('analyzeExam');

  const uploadedFile = await client.files.create({
    file: exam,
    purpose: 'assistants',
  });

  console.log('uploadedFile', uploadedFile);

  const response = await client.responses.create({
    model: 'gpt-5',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            file_id: uploadedFile.id,
          },
          {
            type: 'input_text',
            text: 'Analiza el examen y extrae la información. Primero di los valores de los parámetros del examen y luego el análisis.',
          },
        ],
      },
    ],
  });

  return response.output_text;
}
