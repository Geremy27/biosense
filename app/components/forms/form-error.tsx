type FormErrorProps = {
  message: string;
};

// Renders a validation or action error message for forms.
export function FormError({ message }: FormErrorProps) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}
