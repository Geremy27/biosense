import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Form, Link } from 'react-router';

import { FieldError } from '~/components/forms/field-error';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';

export type LabAnalyteDraft = {
  name: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  optimalRange: string | null;
  flag: string | null;
};

type LabReportReviewFormProps = {
  patientId: string;
  report: {
    labName: string | null;
    panelName: string | null;
    collectedAt: string | null;
  };
  initialAnalytes: LabAnalyteDraft[];
  errors?: Record<string, string>;
};

const EMPTY_ANALYTE: LabAnalyteDraft = {
  name: '',
  value: '',
  unit: null,
  referenceRange: null,
  optimalRange: null,
  flag: null,
};

export function LabReportReviewForm({
  patientId,
  report,
  initialAnalytes,
  errors,
}: LabReportReviewFormProps) {
  const [analytes, setAnalytes] = useState(initialAnalytes);

  function updateAnalyte(index: number, field: keyof LabAnalyteDraft, value: string) {
    setAnalytes((current) =>
      current.map((analyte, rowIndex) =>
        rowIndex === index ? { ...analyte, [field]: value || null } : analyte,
      ),
    );
  }

  return (
    <Form
      method="post"
      className="space-y-6"
      onSubmit={(event) => {
        if (!window.confirm('¿Confirmas que el PDF y todos los valores coinciden?')) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="intent" value="confirm" />
      <input type="hidden" name="analytesJson" value={JSON.stringify(analytes)} />

      <FormPendingFieldset className="space-y-6">
        <section className="card space-y-4">
          <div>
            <h3 className="text-lg font-bold text-cyan-950">Datos del informe</h3>
            <p className="mt-1 text-sm text-slate-500">
              Corrige únicamente lo que puedas verificar en el PDF.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="labName" label="Laboratorio">
              <input
                id="labName"
                name="labName"
                className="input"
                defaultValue={report.labName ?? ''}
              />
              <FieldError message={errors?.labName} />
            </FormField>
            <FormField id="panelName" label="Panel">
              <input
                id="panelName"
                name="panelName"
                className="input"
                defaultValue={report.panelName ?? ''}
              />
              <FieldError message={errors?.panelName} />
            </FormField>
            <FormField id="collectedAt" label="Fecha de toma">
              <input
                id="collectedAt"
                name="collectedAt"
                type="date"
                className="input"
                defaultValue={report.collectedAt ?? ''}
              />
              <FieldError message={errors?.collectedAt} />
            </FormField>
          </div>
        </section>

        <section className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-cyan-950">Valores extraídos</h3>
              <p className="mt-1 text-sm text-slate-500">
                Los rangos solo deben conservarse cuando aparecen en el informe.
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost gap-2"
              onClick={() => setAnalytes((current) => [...current, { ...EMPTY_ANALYTE }])}
            >
              <Plus className="size-4" aria-hidden />
              Agregar valor
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {analytes.map((analyte, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField id={`analyte-${index}-name`} label="Parámetro">
                    <input
                      id={`analyte-${index}-name`}
                      className="input"
                      value={analyte.name}
                      onChange={(event) => updateAnalyte(index, 'name', event.target.value)}
                      required
                    />
                    <FieldError message={errors?.[`analytes.${index}.name`]} />
                  </FormField>
                  <FormField id={`analyte-${index}-value`} label="Valor">
                    <input
                      id={`analyte-${index}-value`}
                      className="input"
                      value={analyte.value}
                      onChange={(event) => updateAnalyte(index, 'value', event.target.value)}
                      required
                    />
                    <FieldError message={errors?.[`analytes.${index}.value`]} />
                  </FormField>
                  <FormField id={`analyte-${index}-unit`} label="Unidad">
                    <input
                      id={`analyte-${index}-unit`}
                      className="input"
                      value={analyte.unit ?? ''}
                      onChange={(event) => updateAnalyte(index, 'unit', event.target.value)}
                    />
                  </FormField>
                  <FormField id={`analyte-${index}-reference`} label="Rango de referencia">
                    <input
                      id={`analyte-${index}-reference`}
                      className="input"
                      value={analyte.referenceRange ?? ''}
                      onChange={(event) =>
                        updateAnalyte(index, 'referenceRange', event.target.value)
                      }
                    />
                  </FormField>
                  <FormField id={`analyte-${index}-optimal`} label="Rango óptimo">
                    <input
                      id={`analyte-${index}-optimal`}
                      className="input"
                      value={analyte.optimalRange ?? ''}
                      onChange={(event) => updateAnalyte(index, 'optimalRange', event.target.value)}
                    />
                  </FormField>
                  <FormField id={`analyte-${index}-flag`} label="Indicador">
                    <input
                      id={`analyte-${index}-flag`}
                      className="input"
                      value={analyte.flag ?? ''}
                      onChange={(event) => updateAnalyte(index, 'flag', event.target.value)}
                    />
                  </FormField>
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                  onClick={() =>
                    setAnalytes((current) => current.filter((_, rowIndex) => rowIndex !== index))
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <FieldError message={errors?.analytes} />
          {errors?._form ? <p className="mt-4 text-sm text-red-600">{errors._form}</p> : null}
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <label className="flex items-start gap-3 text-sm text-amber-950">
            <input type="checkbox" required className="mt-1 size-4" />
            <span>
              Verifiqué que el PDF y los valores coinciden. Al confirmar, este informe quedará
              bloqueado y no podrá editarse.
            </span>
          </label>
        </section>

        <div className="flex flex-wrap gap-3">
          <SubmitButton loadingLabel="Confirmando…">Confirmar y guardar</SubmitButton>
          <Link to={`/provider/patients/${patientId}/labs`} className="btn-ghost">
            Cancelar
          </Link>
        </div>
      </FormPendingFieldset>
    </Form>
  );
}
