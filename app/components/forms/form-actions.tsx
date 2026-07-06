import { Link } from 'react-router';

import { SubmitButton } from '~/components/forms/submit-button';
import { useFormPending } from '~/components/forms/use-form-pending';

type FormActionsProps = {
  submitLabel: string;
  loadingLabel: string;
  cancelTo: string;
  cancelLabel?: string;
  intent?: string;
  excludeIntent?: string;
};

// Renders primary submit and secondary cancel actions. Must be rendered inside a <Form>.
export function FormActions({
  submitLabel,
  loadingLabel,
  cancelTo,
  cancelLabel = 'Cancelar',
  intent,
  excludeIntent,
}: FormActionsProps) {
  const pendingOptions =
    intent !== undefined ? { intent } : excludeIntent !== undefined ? { excludeIntent } : undefined;
  const { isPending } = useFormPending(pendingOptions);

  return (
    <div className="flex gap-3 pt-2">
      <SubmitButton loadingLabel={loadingLabel} pendingOptions={pendingOptions}>
        {submitLabel}
      </SubmitButton>
      <Link
        to={cancelTo}
        className={`btn-ghost ${isPending ? 'pointer-events-none opacity-50' : ''}`}
        aria-disabled={isPending}
        tabIndex={isPending ? -1 : undefined}
      >
        {cancelLabel}
      </Link>
    </div>
  );
}
