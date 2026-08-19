import { Form } from 'react-router';

import { FormField } from '~/components/forms/form-field';
import { FieldError } from '~/components/forms/field-error';
import { FormActions } from '~/components/forms/form-actions';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import type { PatientInput } from '~/validation/patients';
import { IDENTIFICATION_TYPE_OPTIONS, SEX_OPTIONS } from '~/utils/patient-display';

type NutritionRegionOption = {
  id: string;
  name: string;
};

type PatientFormProps = {
  defaultValues?: Partial<PatientInput>;
  errors?: Record<string, string>;
  submitLabel: string;
  cancelTo: string;
  nutritionRegions: NutritionRegionOption[];
};

// Renders the shared patient create/edit form fields.
export function PatientForm({
  defaultValues,
  errors,
  submitLabel,
  cancelTo,
  nutritionRegions,
}: PatientFormProps) {
  return (
    <Form method="post" className="card space-y-8">
      <FormPendingFieldset className="space-y-8" excludeIntent="delete">
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Identificación</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="identificationType" label="Tipo de identificación">
            <select
              id="identificationType"
              name="identificationType"
              className="input"
              defaultValue={defaultValues?.identificationType ?? ''}
              required
            >
              <option value="">Selecciona un tipo</option>
              {IDENTIFICATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors?.identificationType} />
          </FormField>

          <FormField id="identificationNumber" label="Número de identificación">
            <input
              id="identificationNumber"
              name="identificationNumber"
              type="text"
              required
              defaultValue={defaultValues?.identificationNumber ?? ''}
              className="input"
            />
            <FieldError message={errors?.identificationNumber} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Nombres</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="firstName" label="Primer nombre">
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              defaultValue={defaultValues?.firstName ?? ''}
              className="input"
            />
            <FieldError message={errors?.firstName} />
          </FormField>

          <FormField id="secondName" label="Segundo nombre">
            <input
              id="secondName"
              name="secondName"
              type="text"
              defaultValue={defaultValues?.secondName ?? ''}
              className="input"
            />
            <FieldError message={errors?.secondName} />
          </FormField>

          <FormField id="firstLastName" label="Primer apellido">
            <input
              id="firstLastName"
              name="firstLastName"
              type="text"
              required
              defaultValue={defaultValues?.firstLastName ?? ''}
              className="input"
            />
            <FieldError message={errors?.firstLastName} />
          </FormField>

          <FormField id="secondLastName" label="Segundo apellido">
            <input
              id="secondLastName"
              name="secondLastName"
              type="text"
              defaultValue={defaultValues?.secondLastName ?? ''}
              className="input"
            />
            <FieldError message={errors?.secondLastName} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Datos personales</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="birthDate" label="Fecha de nacimiento">
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              required
              defaultValue={defaultValues?.birthDate ?? ''}
              className="input"
            />
            <FieldError message={errors?.birthDate} />
          </FormField>

          <FormField id="sex" label="Sexo">
            <select id="sex" name="sex" className="input" defaultValue={defaultValues?.sex ?? ''}>
              <option value="">Sin especificar</option>
              {SEX_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors?.sex} />
          </FormField>

          <FormField id="birthPlace" label="Lugar de nacimiento">
            <input
              id="birthPlace"
              name="birthPlace"
              type="text"
              required
              defaultValue={defaultValues?.birthPlace ?? ''}
              className="input"
            />
            <FieldError message={errors?.birthPlace} />
          </FormField>

          <FormField id="residenceRegionId" label="Ciudad / región (nutrición local)">
            <select
              id="residenceRegionId"
              name="residenceRegionId"
              className="input"
              required
              defaultValue={defaultValues?.residenceRegionId ?? ''}
            >
              <option value="">Selecciona una ciudad o región</option>
              {nutritionRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <FieldError message={errors?.residenceRegionId} />
          </FormField>

          <FormField id="residencePlace" label="Detalle de residencia">
            <input
              id="residencePlace"
              name="residencePlace"
              type="text"
              required
              defaultValue={defaultValues?.residencePlace ?? ''}
              className="input"
              placeholder="Barrio, municipio u otra precisión"
            />
            <FieldError message={errors?.residencePlace} />
          </FormField>

          <FormField id="ethnicity" label="Etnia">
            <input
              id="ethnicity"
              name="ethnicity"
              type="text"
              defaultValue={defaultValues?.ethnicity ?? ''}
              className="input"
            />
            <FieldError message={errors?.ethnicity} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Contacto</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="phone" label="Teléfono">
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={defaultValues?.phone ?? ''}
              className="input"
            />
            <FieldError message={errors?.phone} />
          </FormField>

          <FormField id="email" label="Correo electrónico">
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={defaultValues?.email ?? ''}
              className="input"
            />
            <FieldError message={errors?.email} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Medidas (opcional)</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="heightCm" label="Estatura (cm)">
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.heightCm ?? ''}
              className="input"
            />
            <FieldError message={errors?.heightCm} />
          </FormField>

          <FormField id="weightKg" label="Peso (kg)">
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.weightKg ?? ''}
              className="input"
            />
            <FieldError message={errors?.weightKg} />
          </FormField>
        </div>
      </section>

      {errors?._form ? <p className="text-sm text-red-600">{errors._form}</p> : null}

      <FormActions
        submitLabel={submitLabel}
        loadingLabel={submitLabel.startsWith('Crear') ? 'Creando…' : 'Guardando…'}
        cancelTo={cancelTo}
        excludeIntent="delete"
      />
      </FormPendingFieldset>
    </Form>
  );
}
