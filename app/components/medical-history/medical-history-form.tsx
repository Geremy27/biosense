import { FieldError } from '~/components/forms/field-error';
import { FormActions } from '~/components/forms/form-actions';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { Sex } from '~/db/models/enums';
import type { MedicalHistoryInput } from '~/validation/medical-history';

type MedicalHistoryFormProps = {
  submitLabel: string;
  cancelTo: string;
  errors?: Record<string, string>;
  defaultValues?: Partial<MedicalHistoryInput>;
  patientSex?: Sex | null;
};

type TextAreaFieldProps = {
  id: keyof MedicalHistoryInput;
  label: string;
  placeholder: string;
  rows?: number;
  defaultValues?: Partial<MedicalHistoryInput>;
  errors?: Record<string, string>;
};

function TextAreaField({
  id,
  label,
  placeholder,
  rows = 3,
  defaultValues,
  errors,
}: TextAreaFieldProps) {
  return (
    <FormField id={id} label={label}>
      <textarea
        id={id}
        name={id}
        rows={rows}
        className="input"
        defaultValue={defaultValues?.[id] ?? ''}
        placeholder={placeholder}
      />
      <FieldError message={errors?.[id]} />
    </FormField>
  );
}

export function MedicalHistoryForm({
  submitLabel,
  cancelTo,
  errors,
  defaultValues,
  patientSex,
}: MedicalHistoryFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const showGynecoObstetric = patientSex === Sex.FEMALE;

  return (
    <FormPendingFieldset className="space-y-8">
      <div className="space-y-6">
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

        <TextAreaField
          id="chiefComplaint"
          label="Motivo de consulta"
          placeholder="Síntomas actuales, objetivos del paciente, quejas principales"
          defaultValues={defaultValues}
          errors={errors}
        />
      </div>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-900">
          Antecedentes personales
        </h3>

        <TextAreaField
          id="personalHistory1"
          label="Personales 1 — Diagnósticos dados"
          placeholder="Diagnósticos confirmados, con fecha o hace cuánto tiempo"
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="personalHistory2"
          label="Personales 2 — Diagnósticos en estudio"
          placeholder="Diagnósticos que están siendo estudiados actualmente"
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="surgicalHistory"
          label="Quirúrgicos"
          placeholder="Cuál procedimiento y fecha"
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="medications"
          label="Medicamentosos"
          placeholder="Cuáles, cómo (dosis) y fecha de inicio"
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="supplements"
          label="Suplementos"
          placeholder="Cuáles, cómo (dosis) y fecha de inicio"
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="infectiousHistory"
          label="Infecciosos (recurrentes)"
          placeholder="Infecciones recurrentes relevantes"
          rows={2}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="traumaticHistory"
          label="Traumáticos"
          placeholder="Físicos (accidentes), emocionales y psicológicos: cuáles y cuándo"
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="toxicologicalHistory"
          label="Toxicológicos"
          placeholder="Fuma o toma: cantidad y frecuencia"
          rows={2}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="allergies"
          label="Alergias"
          placeholder="Conocidas a medicamentos o alimentos"
          rows={2}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="vaccines"
          label="Vacunas *"
          placeholder="Últimas de los últimos 5 años, cuántas dosis"
          rows={2}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="habits"
          label="Hábitos"
          placeholder="Cuántas veces orina y hace deposiciones al día, alguna característica especial"
          rows={2}
          defaultValues={defaultValues}
          errors={errors}
        />

        {showGynecoObstetric ? (
          <TextAreaField
            id="gynecoObstetricHistory"
            label="Ginecoobstétricos (G/O) *"
            placeholder="Fecha de primera menstruación, regularidad y síntomas; fecha de menopausia, regularidad y síntomas; tipo de planificación usada; número de embarazos"
            rows={4}
            defaultValues={defaultValues}
            errors={errors}
          />
        ) : null}
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-900">
          Antecedentes familiares y psicosociales
        </h3>

        <TextAreaField
          id="familyHistory"
          label="Familiares"
          placeholder="Padres, abuelos"
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
        <TextAreaField
          id="psychosocialHistory"
          label="Psicosociales *"
          placeholder="Enfermedad predominante en el círculo de amigos"
          rows={2}
          defaultValues={defaultValues}
          errors={errors}
        />
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <p className="text-xs text-slate-500">
          * No aplica para todos los pacientes o es información difícil de obtener.
        </p>
        <TextAreaField
          id="notes"
          label="Notas adicionales"
          placeholder=""
          rows={3}
          defaultValues={defaultValues}
          errors={errors}
        />
      </section>

      {errors?._form ? <p className="text-sm text-red-600">{errors._form}</p> : null}

      <FormActions submitLabel={submitLabel} loadingLabel="Guardando…" cancelTo={cancelTo} />
    </FormPendingFieldset>
  );
}
