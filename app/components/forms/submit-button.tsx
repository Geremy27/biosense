import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { useFormPending } from '~/components/forms/use-form-pending';

type SubmitButtonVariant = 'primary' | 'danger';

type UseFormPendingOptions = {
  intent?: string;
  excludeIntent?: string;
};

type SubmitButtonProps = {
  children: ReactNode;
  loadingLabel: string;
  className?: string;
  variant?: SubmitButtonVariant;
  pendingOptions?: UseFormPendingOptions;
};

const VARIANT_CLASSES: Record<SubmitButtonVariant, string> = {
  primary: 'btn-primary',
  danger:
    'inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-all duration-150 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-60',
};

// Renders a submit button with loading feedback. Must be rendered inside a <Form>.
export function SubmitButton({
  children,
  loadingLabel,
  className = '',
  variant = 'primary',
  pendingOptions,
}: SubmitButtonProps) {
  const { isPending } = useFormPending(pendingOptions);

  return (
    <button
      type="submit"
      disabled={isPending}
      aria-busy={isPending}
      className={`${VARIANT_CLASSES[variant]} gap-2 disabled:pointer-events-none disabled:opacity-60 ${className}`}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
