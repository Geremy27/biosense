import type { ReactNode } from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
};

// Renders a labeled form field with consistent spacing.
export function FormField({ id, label, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
    </div>
  );
}
