import { FieldError } from '~/components/forms/field-error';
import { FormActions } from '~/components/forms/form-actions';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import type { MedicalHistoryInput } from '~/validation/medical-history';

type MedicalHistoryFormProps = {
  submitLabel: string;
  cancelTo: string;
  errors?: Record<string, string>;
  defaultValues?: Partial<MedicalHistoryInput>;
};

export function MedicalHistoryForm({
  submitLabel,
  cancelTo,
  errors,
  defaultValues,
}: MedicalHistoryFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <FormPendingFieldset className="space-y-6">
      <FormField id="title" label="Título">
        <input
          id="title"
          name="title"
          className="input"
          required
          defaultValue={defaultValues?.title ?? ''}
          placeholder="Ej: Consulta inicial, Actualización de hábitos"
        />
        <FieldError message={errors?.title} />
      </FormField>

      <FormField id="recordedAt" label="Fecha del registro">
        <input
          id="recordedAt"
          name="recordedAt"
          type="date"
          className="input"
          required
          defaultValue={defaultValues?.recordedAt ?? today}
        />
        <FieldError message={errors?.recordedAt} />
      </FormField>

      <FormField id="chiefComplaint" label="Motivo de consulta">
        <textarea
          id="chiefComplaint"
          name="chiefComplaint"
          rows={3}
          className="input"
          defaultValue={defaultValues?.chiefComplaint ?? ''}
          placeholder="Síntomas actuales, objetivos del paciente, quejas principales"
        />
        <FieldError message={errors?.chiefComplaint} />
      </FormField>

      <FormField id="personalHistory" label="Antecedentes personales">
        <textarea
          id="personalHistory"
          name="personalHistory"
          rows={4}
          className="input"
          defaultValue={defaultValues?.personalHistory ?? ''}
          placeholder="Enfermedades previas, diagnósticos, hospitalizaciones"
        />
        <FieldError message={errors?.personalHistory} />
      </FormField>

      <FormField id="familyHistory" label="Antecedentes familiares">
        <textarea
          id="familyHistory"
          name="familyHistory"
          rows={3}
          className="input"
          defaultValue={defaultValues?.familyHistory ?? ''}
          placeholder="Historia familiar relevante (diabetes, cardiovascular, cáncer, etc.)"
        />
        <FieldError message={errors?.familyHistory} />
      </FormField>

      <FormField id="surgicalHistory" label="Antecedentes quirúrgicos">
        <textarea
          id="surgicalHistory"
          name="surgicalHistory"
          rows={3}
          className="input"
          defaultValue={defaultValues?.surgicalHistory ?? ''}
          placeholder="Cirugías previas y fechas aproximadas"
        />
        <FieldError message={errors?.surgicalHistory} />
      </FormField>

      <FormField id="allergies" label="Alergias">
        <textarea
          id="allergies"
          name="allergies"
          rows={2}
          className="input"
          defaultValue={defaultValues?.allergies ?? ''}
          placeholder="Medicamentos, alimentos u otros alérgenos"
        />
        <FieldError message={errors?.allergies} />
      </FormField>

      <FormField id="medicationsAndSupplements" label="Medicación y suplementos actuales">
        <textarea
          id="medicationsAndSupplements"
          name="medicationsAndSupplements"
          rows={4}
          className="input"
          defaultValue={defaultValues?.medicationsAndSupplements ?? ''}
          placeholder="Ej: Magnesio 200 mg noche; Vitamina D 2000 UI diaria; Losartán 50 mg"
        />
        <FieldError message={errors?.medicationsAndSupplements} />
      </FormField>

      <FormField id="habitsLifestyle" label="Hábitos y estilo de vida">
        <textarea
          id="habitsLifestyle"
          name="habitsLifestyle"
          rows={4}
          className="input"
          defaultValue={defaultValues?.habitsLifestyle ?? ''}
          placeholder="Tabaco, alcohol, ejercicio/deporte actual, sueño, estrés, ocupación"
        />
        <FieldError message={errors?.habitsLifestyle} />
      </FormField>

      <FormField id="notes" label="Notas adicionales">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="input"
          defaultValue={defaultValues?.notes ?? ''}
        />
        <FieldError message={errors?.notes} />
      </FormField>

      {errors?._form ? <p className="text-sm text-red-600">{errors._form}</p> : null}

      <FormActions submitLabel={submitLabel} loadingLabel="Guardando…" cancelTo={cancelTo} />
    </FormPendingFieldset>
  );
}
