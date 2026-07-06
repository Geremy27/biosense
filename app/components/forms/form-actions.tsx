import { Link } from 'react-router';

type FormActionsProps = {
  submitLabel: string;
  cancelTo: string;
};

// Renders primary submit and secondary cancel actions for forms.
export function FormActions({ submitLabel, cancelTo }: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
      <Link to={cancelTo} className="btn-ghost">
        Cancelar
      </Link>
    </div>
  );
}
