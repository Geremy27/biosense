import type { ZodError } from 'zod';

// Converts a Zod error into a flat map of field names to Spanish messages.
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.map(String).join('.');

    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
}
