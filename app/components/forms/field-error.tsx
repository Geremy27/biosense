type FieldErrorProps = {
  message?: string;
};

// Renders a field-level validation message below a form control.
export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}
