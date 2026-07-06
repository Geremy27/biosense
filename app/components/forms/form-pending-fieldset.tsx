import type { ReactNode } from 'react';

import { useFormPending } from '~/components/forms/use-form-pending';

type FormPendingFieldsetProps = {
  children: ReactNode;
  className?: string;
  intent?: string;
  excludeIntent?: string;
};

// Disables fields while the parent form is submitting. Must be rendered inside a <Form>.
export function FormPendingFieldset({
  children,
  className = '',
  intent,
  excludeIntent,
}: FormPendingFieldsetProps) {
  const { isPending } = useFormPending(
    intent !== undefined ? { intent } : excludeIntent !== undefined ? { excludeIntent } : undefined,
  );

  return (
    <fieldset disabled={isPending} className={`border-0 p-0 disabled:opacity-80 ${className}`}>
      {children}
    </fieldset>
  );
}
