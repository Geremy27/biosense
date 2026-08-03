import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Form } from 'react-router';

import { FieldError } from '~/components/forms/field-error';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import type { RecommendationOutput } from '~/validation/recommendations';

type ConclusionDraft = RecommendationOutput['conclusions'][number];
type RecommendationDraft = RecommendationOutput['recommendations'][number];
type SupplementDraft = RecommendationOutput['possibleSupplements'][number];

type RecommendationEditFormProps = {
  output: RecommendationOutput;
  onCancel: () => void;
  errors?: Record<string, string>;
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const EMPTY_CONCLUSION: ConclusionDraft = { statement: '', rationale: '' };
const EMPTY_RECOMMENDATION: RecommendationDraft = { action: '', rationale: '' };
const EMPTY_SUPPLEMENT: SupplementDraft = {
  name: '',
  dose: null,
  rationale: '',
  requiresMoreLabs: false,
  missingLabs: null,
};

export function RecommendationEditForm({
  output,
  onCancel,
  errors,
}: RecommendationEditFormProps) {
  const [executiveSummary, setExecutiveSummary] = useState(output.executiveSummary);
  const [conclusions, setConclusions] = useState(output.conclusions);
  const [recommendations, setRecommendations] = useState(output.recommendations);
  const [supplements, setSupplements] = useState(output.possibleSupplements);
  const [lifestyle, setLifestyle] = useState(output.lifestyle);

  return (
    <Form method="post" className="space-y-6">
      <input type="hidden" name="intent" value="save-edit" />
      <input type="hidden" name="executiveSummaryJson" value={JSON.stringify(executiveSummary)} />
      <input type="hidden" name="conclusionsJson" value={JSON.stringify(conclusions)} />
      <input type="hidden" name="recommendationsJson" value={JSON.stringify(recommendations)} />
      <input type="hidden" name="possibleSupplementsJson" value={JSON.stringify(supplements)} />

      <FormPendingFieldset intent="save-edit" className="space-y-6">
        <section className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-cyan-950">Resumen ejecutivo</h3>
              <p className="mt-1 text-sm text-slate-500">
                Viñetas cortas solo para el médico, no se comparten con el paciente.
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost gap-2"
              onClick={() => setExecutiveSummary((current) => [...current, ''])}
            >
              <Plus className="size-4" aria-hidden />
              Agregar viñeta
            </button>
          </div>
          <div className="space-y-3">
            {executiveSummary.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <input
                  className="input"
                  value={line}
                  onChange={(event) =>
                    setExecutiveSummary((current) =>
                      current.map((value, i) => (i === index ? event.target.value : value)),
                    )
                  }
                />
                <button
                  type="button"
                  className="mt-2 text-red-600 hover:text-red-700"
                  onClick={() =>
                    setExecutiveSummary((current) => current.filter((_, i) => i !== index))
                  }
                  aria-label="Quitar viñeta"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <FieldError message={errors?.executiveSummary} />
        </section>

        <section className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-cyan-950">Conclusiones</h3>
            <button
              type="button"
              className="btn-ghost gap-2"
              onClick={() => setConclusions((current) => [...current, { ...EMPTY_CONCLUSION }])}
            >
              <Plus className="size-4" aria-hidden />
              Agregar
            </button>
          </div>
          <div className="space-y-4">
            {conclusions.map((item, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <FormField id={`conclusion-${index}-statement`} label="Conclusión">
                  <textarea
                    id={`conclusion-${index}-statement`}
                    className="input"
                    rows={2}
                    value={item.statement}
                    onChange={(event) =>
                      setConclusions((current) =>
                        current.map((value, i) =>
                          i === index ? { ...value, statement: event.target.value } : value,
                        ),
                      )
                    }
                  />
                </FormField>
                <FormField id={`conclusion-${index}-rationale`} label="Por qué (rationale)">
                  <textarea
                    id={`conclusion-${index}-rationale`}
                    className="input mt-3"
                    rows={2}
                    value={item.rationale}
                    onChange={(event) =>
                      setConclusions((current) =>
                        current.map((value, i) =>
                          i === index ? { ...value, rationale: event.target.value } : value,
                        ),
                      )
                    }
                  />
                </FormField>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                  onClick={() =>
                    setConclusions((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <FieldError message={errors?.conclusions} />
        </section>

        <section className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-cyan-950">Recomendaciones</h3>
            <button
              type="button"
              className="btn-ghost gap-2"
              onClick={() =>
                setRecommendations((current) => [...current, { ...EMPTY_RECOMMENDATION }])
              }
            >
              <Plus className="size-4" aria-hidden />
              Agregar
            </button>
          </div>
          <div className="space-y-4">
            {recommendations.map((item, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <FormField id={`recommendation-${index}-action`} label="Recomendación">
                  <textarea
                    id={`recommendation-${index}-action`}
                    className="input"
                    rows={2}
                    value={item.action}
                    onChange={(event) =>
                      setRecommendations((current) =>
                        current.map((value, i) =>
                          i === index ? { ...value, action: event.target.value } : value,
                        ),
                      )
                    }
                  />
                </FormField>
                <FormField id={`recommendation-${index}-rationale`} label="Por qué (rationale)">
                  <textarea
                    id={`recommendation-${index}-rationale`}
                    className="input mt-3"
                    rows={2}
                    value={item.rationale}
                    onChange={(event) =>
                      setRecommendations((current) =>
                        current.map((value, i) =>
                          i === index ? { ...value, rationale: event.target.value } : value,
                        ),
                      )
                    }
                  />
                </FormField>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                  onClick={() =>
                    setRecommendations((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <FieldError message={errors?.recommendations} />
        </section>

        <section className="card space-y-4">
          <h3 className="text-lg font-bold text-cyan-950">Sugerencias de estilo de vida</h3>
          {(
            [
              ['nutrition', '1. Nutricional'],
              ['exercise', '2. Ejercicio'],
              ['mentalAndSleep', '3. Mental y sueño'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="rounded-lg border border-slate-200 p-4">
              <p className="font-semibold text-cyan-900">{label}</p>

              <FormField id={`lifestyle-${key}-keynumbers`} label="Datos rápidos (cuadrito visual)">
                <div className="space-y-2">
                  {lifestyle[key].keyNumbers.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        className="input"
                        placeholder="Etiqueta (ej. Proteína)"
                        value={item.label}
                        onChange={(event) =>
                          setLifestyle((current) => ({
                            ...current,
                            [key]: {
                              ...current[key],
                              keyNumbers: current[key].keyNumbers.map((kn, i) =>
                                i === index ? { ...kn, label: event.target.value } : kn,
                              ),
                            },
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Valor (ej. 120 g/día)"
                        value={item.value}
                        onChange={(event) =>
                          setLifestyle((current) => ({
                            ...current,
                            [key]: {
                              ...current[key],
                              keyNumbers: current[key].keyNumbers.map((kn, i) =>
                                i === index ? { ...kn, value: event.target.value } : kn,
                              ),
                            },
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700"
                        aria-label="Quitar dato"
                        onClick={() =>
                          setLifestyle((current) => ({
                            ...current,
                            [key]: {
                              ...current[key],
                              keyNumbers: current[key].keyNumbers.filter((_, i) => i !== index),
                            },
                          }))
                        }
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  ))}
                  {lifestyle[key].keyNumbers.length < 4 ? (
                    <button
                      type="button"
                      className="btn-ghost gap-2"
                      onClick={() =>
                        setLifestyle((current) => ({
                          ...current,
                          [key]: {
                            ...current[key],
                            keyNumbers: [...current[key].keyNumbers, { label: '', value: '' }],
                          },
                        }))
                      }
                    >
                      <Plus className="size-4" aria-hidden />
                      Agregar dato
                    </button>
                  ) : null}
                </div>
              </FormField>

              <FormField id={`lifestyle-${key}-patient-summary`} label="Por qué, para el paciente (claro y simple)">
                <textarea
                  id={`lifestyle-${key}-patient-summary`}
                  className="input mt-3"
                  rows={2}
                  value={lifestyle[key].patientSummary}
                  onChange={(event) =>
                    setLifestyle((current) => ({
                      ...current,
                      [key]: { ...current[key], patientSummary: event.target.value },
                    }))
                  }
                />
              </FormField>

              <FormField id={`lifestyle-${key}-guidance`} label="Guía detallada">
                <textarea
                  id={`lifestyle-${key}-guidance`}
                  className="input mt-3"
                  rows={3}
                  value={lifestyle[key].guidance}
                  onChange={(event) =>
                    setLifestyle((current) => ({
                      ...current,
                      [key]: { ...current[key], guidance: event.target.value },
                    }))
                  }
                />
              </FormField>
              <FormField id={`lifestyle-${key}-rationale`} label="Por qué, para el médico (denso y científico)">
                <textarea
                  id={`lifestyle-${key}-rationale`}
                  className="input mt-3"
                  rows={2}
                  value={lifestyle[key].rationale}
                  onChange={(event) =>
                    setLifestyle((current) => ({
                      ...current,
                      [key]: { ...current[key], rationale: event.target.value },
                    }))
                  }
                />
              </FormField>
            </div>
          ))}
          {(['nutrition', 'exercise', 'mentalAndSleep'] as const).map((key) => (
            <span key={key}>
              <input type="hidden" name={`lifestyle${capitalize(key)}Guidance`} value={lifestyle[key].guidance} />
              <input type="hidden" name={`lifestyle${capitalize(key)}Rationale`} value={lifestyle[key].rationale} />
              <input
                type="hidden"
                name={`lifestyle${capitalize(key)}PatientSummary`}
                value={lifestyle[key].patientSummary}
              />
              <input
                type="hidden"
                name={`lifestyle${capitalize(key)}KeyNumbersJson`}
                value={JSON.stringify(lifestyle[key].keyNumbers)}
              />
            </span>
          ))}
        </section>

        <section className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-cyan-950">Posibles suplementos</h3>
            <button
              type="button"
              className="btn-ghost gap-2"
              onClick={() => setSupplements((current) => [...current, { ...EMPTY_SUPPLEMENT }])}
            >
              <Plus className="size-4" aria-hidden />
              Agregar
            </button>
          </div>
          <div className="space-y-4">
            {supplements.map((item, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField id={`supplement-${index}-name`} label="Nombre">
                    <input
                      id={`supplement-${index}-name`}
                      className="input"
                      value={item.name}
                      onChange={(event) =>
                        setSupplements((current) =>
                          current.map((value, i) =>
                            i === index ? { ...value, name: event.target.value } : value,
                          ),
                        )
                      }
                    />
                  </FormField>
                  <FormField id={`supplement-${index}-dose`} label="Dosis">
                    <input
                      id={`supplement-${index}-dose`}
                      className="input"
                      value={item.dose ?? ''}
                      onChange={(event) =>
                        setSupplements((current) =>
                          current.map((value, i) =>
                            i === index
                              ? { ...value, dose: event.target.value || null }
                              : value,
                          ),
                        )
                      }
                    />
                  </FormField>
                </div>
                <FormField id={`supplement-${index}-rationale`} label="Por qué (rationale)">
                  <textarea
                    id={`supplement-${index}-rationale`}
                    className="input mt-3"
                    rows={2}
                    value={item.rationale}
                    onChange={(event) =>
                      setSupplements((current) =>
                        current.map((value, i) =>
                          i === index ? { ...value, rationale: event.target.value } : value,
                        ),
                      )
                    }
                  />
                </FormField>
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.requiresMoreLabs}
                    onChange={(event) =>
                      setSupplements((current) =>
                        current.map((value, i) =>
                          i === index
                            ? { ...value, requiresMoreLabs: event.target.checked }
                            : value,
                        ),
                      )
                    }
                  />
                  Requiere más laboratorios
                </label>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                  onClick={() =>
                    setSupplements((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <FieldError message={errors?.possibleSupplements} />
        </section>

        {errors?._form ? <p className="text-sm text-red-600">{errors._form}</p> : null}

        <div className="flex flex-wrap gap-3">
          <SubmitButton loadingLabel="Guardando…" pendingOptions={{ intent: 'save-edit' }}>
            Guardar cambios
          </SubmitButton>
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </FormPendingFieldset>
    </Form>
  );
}
