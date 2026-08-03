const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class PdfUploadError extends Error {}

// Validates a multipart form file field is a reasonably-sized PDF. Throws
// PdfUploadError with a user-facing Spanish message on failure.
export function validatePdfUpload(
  value: FormDataEntryValue | null,
  maxUploadBytesEnvVar?: string,
): File {
  if (!(value instanceof File) || value.size === 0) {
    throw new PdfUploadError('Selecciona un archivo PDF.');
  }

  if (
    value.type &&
    value.type !== 'application/pdf' &&
    value.type !== 'application/octet-stream'
  ) {
    throw new PdfUploadError('El archivo debe ser un PDF.');
  }

  const configuredMax = maxUploadBytesEnvVar ? Number(process.env[maxUploadBytesEnvVar]) : NaN;
  const maxBytes =
    Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : DEFAULT_MAX_UPLOAD_BYTES;

  if (value.size > maxBytes) {
    throw new PdfUploadError(`El PDF no puede superar ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }

  return value;
}

export async function readPdfBytes(file: File): Promise<Buffer> {
  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new PdfUploadError('El archivo no contiene un PDF válido.');
  }

  return bytes;
}
