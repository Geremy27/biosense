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

const EMPTY_CONCLUSION: ConclusionDraft = { statement: '', rationale: '' };
const EMPTY_RECOMMENDATION: RecommendationDraft = { action: '', rationale: '' };
const EMPTY_SUPPLEMENT: SupplementDraft = {
  name: '',
  dose: null,
  rationale: '',
  requiresMoreLabs: false,
  missingLabs: null,
};
const EMPTY_FOOD_PORTION = { name: '', approximateAmount: '' };
const EMPTY_NUTRIENT_SOURCE = {
  nutrient: '',
  amount: null as string | null,
  foods: [] as Array<{ name: string; approximateAmount: string }>,
  localProducts: [] as Array<{ name: string; approximateAmount: string }>,
};
const EMPTY_PRACTICE = { what: '', howToKnow: '' };
const EMPTY_SLEEP_LEVER = { lever: '', action: '', howToKnow: '' };
const EMPTY_EXERCISE_REASON = { reason: '', explanation: '' };

type NutritionBlock = RecommendationOutput['lifestyle']['nutrition']['macros'];

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
      <input type="hidden" name="lifestyleJson" value={JSON.stringify(lifestyle)} />

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

              {key === 'nutrition' ? (
                <>
                  <FormField id="lifestyle-nutrition-diet-type" label="Tipo de dieta">
                    <input
                      id="lifestyle-nutrition-diet-type"
                      className="input mt-3"
                      value={lifestyle.nutrition.dietType ?? ''}
                      onChange={(event) =>
                        setLifestyle((current) => ({
                          ...current,
                          nutrition: {
                            ...current.nutrition,
                            dietType: event.target.value === '' ? null : event.target.value,
                          },
                        }))
                      }
                    />
                  </FormField>
                  <NutritionBlockEditor
                    idPrefix="macros"
                    title="Macros — de dónde obtenerlos"
                    block={lifestyle.nutrition.macros}
                    onChange={(macros) =>
                      setLifestyle((current) => ({
                        ...current,
                        nutrition: { ...current.nutrition, macros },
                      }))
                    }
                  />
                  <NutritionBlockEditor
                    idPrefix="micros"
                    title="Micros — cuánto de cada alimento cubre la meta"
                    block={lifestyle.nutrition.micros}
                    onChange={(micros) =>
                      setLifestyle((current) => ({
                        ...current,
                        nutrition: { ...current.nutrition, micros },
                      }))
                    }
                  />
                </>
              ) : null}

              {key === 'exercise' ? (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField id="lifestyle-exercise-type" label="Tipo">
                      <textarea
                        id="lifestyle-exercise-type"
                        className="input"
                        rows={2}
                        value={lifestyle.exercise.type}
                        onChange={(event) =>
                          setLifestyle((current) => ({
                            ...current,
                            exercise: { ...current.exercise, type: event.target.value },
                          }))
                        }
                      />
                    </FormField>
                    <FormField id="lifestyle-exercise-duration" label="Duración">
                      <textarea
                        id="lifestyle-exercise-duration"
                        className="input"
                        rows={2}
                        value={lifestyle.exercise.duration}
                        onChange={(event) =>
                          setLifestyle((current) => ({
                            ...current,
                            exercise: { ...current.exercise, duration: event.target.value },
                          }))
                        }
                      />
                    </FormField>
                    <FormField id="lifestyle-exercise-intensity" label="Intensidad">
                      <input
                        id="lifestyle-exercise-intensity"
                        className="input"
                        value={lifestyle.exercise.intensity}
                        onChange={(event) =>
                          setLifestyle((current) => ({
                            ...current,
                            exercise: { ...current.exercise, intensity: event.target.value },
                          }))
                        }
                      />
                    </FormField>
                    <FormField
                      id="lifestyle-exercise-intensity-explanation"
                      label="Qué significa esa intensidad"
                    >
                      <textarea
                        id="lifestyle-exercise-intensity-explanation"
                        className="input"
                        rows={3}
                        value={lifestyle.exercise.intensityExplanation}
                        onChange={(event) =>
                          setLifestyle((current) => ({
                            ...current,
                            exercise: {
                              ...current.exercise,
                              intensityExplanation: event.target.value,
                            },
                          }))
                        }
                      />
                    </FormField>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">Por qué este plan</p>
                    {lifestyle.exercise.reasons.length < 5 ? (
                      <button
                        type="button"
                        className="btn-ghost gap-2"
                        onClick={() =>
                          setLifestyle((current) => ({
                            ...current,
                            exercise: {
                              ...current.exercise,
                              reasons: [
                                ...current.exercise.reasons,
                                { ...EMPTY_EXERCISE_REASON },
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="size-4" aria-hidden />
                        Agregar motivo
                      </button>
                    ) : null}
                  </div>
                  {lifestyle.exercise.reasons.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin motivos todavía.</p>
                  ) : (
                    lifestyle.exercise.reasons.map((item, index) => (
                      <div key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <FormField id={`exercise-reason-${index}`} label={`Motivo ${index + 1}`}>
                          <input
                            id={`exercise-reason-${index}`}
                            className="input"
                            value={item.reason}
                            onChange={(event) =>
                              setLifestyle((current) => ({
                                ...current,
                                exercise: {
                                  ...current.exercise,
                                  reasons: current.exercise.reasons.map((row, i) =>
                                    i === index ? { ...row, reason: event.target.value } : row,
                                  ),
                                },
                              }))
                            }
                          />
                        </FormField>
                        <FormField
                          id={`exercise-reason-${index}-explanation`}
                          label="Explicación"
                        >
                          <textarea
                            id={`exercise-reason-${index}-explanation`}
                            className="input"
                            rows={3}
                            value={item.explanation}
                            onChange={(event) =>
                              setLifestyle((current) => ({
                                ...current,
                                exercise: {
                                  ...current.exercise,
                                  reasons: current.exercise.reasons.map((row, i) =>
                                    i === index
                                      ? { ...row, explanation: event.target.value }
                                      : row,
                                  ),
                                },
                              }))
                            }
                          />
                        </FormField>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                          onClick={() =>
                            setLifestyle((current) => ({
                              ...current,
                              exercise: {
                                ...current.exercise,
                                reasons: current.exercise.reasons.filter((_, i) => i !== index),
                              },
                            }))
                          }
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              {key === 'mentalAndSleep' ? (
                <div className="mt-3 space-y-3">
                  <FormField id="lifestyle-sleep-target" label="Meta de sueño">
                    <input
                      id="lifestyle-sleep-target"
                      className="input"
                      placeholder="Ej. 7–8 h, misma franja ±30 min"
                      value={lifestyle.mentalAndSleep.sleepTarget}
                      onChange={(event) =>
                        setLifestyle((current) => ({
                          ...current,
                          mentalAndSleep: {
                            ...current.mentalAndSleep,
                            sleepTarget: event.target.value,
                          },
                        }))
                      }
                    />
                  </FormField>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">Cómo lograrlo</p>
                    <button
                      type="button"
                      className="btn-ghost gap-2"
                      onClick={() =>
                        setLifestyle((current) => ({
                          ...current,
                          mentalAndSleep: {
                            ...current.mentalAndSleep,
                            sleepProtocol: [
                              ...current.mentalAndSleep.sleepProtocol,
                              { ...EMPTY_SLEEP_LEVER },
                            ],
                          },
                        }))
                      }
                    >
                      <Plus className="size-4" aria-hidden />
                      Agregar palanca
                    </button>
                  </div>
                  {lifestyle.mentalAndSleep.sleepProtocol.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Sin palancas todavía. La meta de horas no basta: indica cómo alcanzarla.
                    </p>
                  ) : (
                    lifestyle.mentalAndSleep.sleepProtocol.map((step, index) => (
                      <div key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <FormField id={`sleep-lever-${index}-name`} label="Palanca">
                          <input
                            id={`sleep-lever-${index}-name`}
                            className="input"
                            placeholder="Ej. Corte de cafeína"
                            value={step.lever}
                            onChange={(event) =>
                              setLifestyle((current) => ({
                                ...current,
                                mentalAndSleep: {
                                  ...current.mentalAndSleep,
                                  sleepProtocol: current.mentalAndSleep.sleepProtocol.map(
                                    (row, i) =>
                                      i === index ? { ...row, lever: event.target.value } : row,
                                  ),
                                },
                              }))
                            }
                          />
                        </FormField>
                        <FormField id={`sleep-lever-${index}-action`} label="Qué hacer">
                          <textarea
                            id={`sleep-lever-${index}-action`}
                            className="input"
                            rows={2}
                            placeholder="Ej. Cero cafeína desde 8 h antes de acostarse"
                            value={step.action}
                            onChange={(event) =>
                              setLifestyle((current) => ({
                                ...current,
                                mentalAndSleep: {
                                  ...current.mentalAndSleep,
                                  sleepProtocol: current.mentalAndSleep.sleepProtocol.map(
                                    (row, i) =>
                                      i === index ? { ...row, action: event.target.value } : row,
                                  ),
                                },
                              }))
                            }
                          />
                        </FormField>
                        <FormField
                          id={`sleep-lever-${index}-how`}
                          label="Cómo saber que se está logrando"
                        >
                          <input
                            id={`sleep-lever-${index}-how`}
                            className="input"
                            value={step.howToKnow}
                            onChange={(event) =>
                              setLifestyle((current) => ({
                                ...current,
                                mentalAndSleep: {
                                  ...current.mentalAndSleep,
                                  sleepProtocol: current.mentalAndSleep.sleepProtocol.map(
                                    (row, i) =>
                                      i === index ? { ...row, howToKnow: event.target.value } : row,
                                  ),
                                },
                              }))
                            }
                          />
                        </FormField>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                          onClick={() =>
                            setLifestyle((current) => ({
                              ...current,
                              mentalAndSleep: {
                                ...current.mentalAndSleep,
                                sleepProtocol: current.mentalAndSleep.sleepProtocol.filter(
                                  (_, i) => i !== index,
                                ),
                              },
                            }))
                          }
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">Prácticas mentales</p>
                    <button
                      type="button"
                      className="btn-ghost gap-2"
                      onClick={() =>
                        setLifestyle((current) => ({
                          ...current,
                          mentalAndSleep: {
                            ...current.mentalAndSleep,
                            practices: [...current.mentalAndSleep.practices, { ...EMPTY_PRACTICE }],
                          },
                        }))
                      }
                    >
                      <Plus className="size-4" aria-hidden />
                      Agregar práctica
                    </button>
                  </div>
                  {lifestyle.mentalAndSleep.practices.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin prácticas todavía.</p>
                  ) : (
                    lifestyle.mentalAndSleep.practices.map((practice, index) => (
                      <div key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <FormField id={`mental-practice-${index}-what`} label="Qué hacer">
                          <input
                            id={`mental-practice-${index}-what`}
                            className="input"
                            value={practice.what}
                            onChange={(event) =>
                              setLifestyle((current) => ({
                                ...current,
                                mentalAndSleep: {
                                  ...current.mentalAndSleep,
                                  practices: current.mentalAndSleep.practices.map((row, i) =>
                                    i === index ? { ...row, what: event.target.value } : row,
                                  ),
                                },
                              }))
                            }
                          />
                        </FormField>
                        <FormField
                          id={`mental-practice-${index}-how`}
                          label="Cómo saber que se está haciendo bien"
                        >
                          <input
                            id={`mental-practice-${index}-how`}
                            className="input"
                            value={practice.howToKnow}
                            onChange={(event) =>
                              setLifestyle((current) => ({
                                ...current,
                                mentalAndSleep: {
                                  ...current.mentalAndSleep,
                                  practices: current.mentalAndSleep.practices.map((row, i) =>
                                    i === index ? { ...row, howToKnow: event.target.value } : row,
                                  ),
                                },
                              }))
                            }
                          />
                        </FormField>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                          onClick={() =>
                            setLifestyle((current) => ({
                              ...current,
                              mentalAndSleep: {
                                ...current.mentalAndSleep,
                                practices: current.mentalAndSleep.practices.filter(
                                  (_, i) => i !== index,
                                ),
                              },
                            }))
                          }
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

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

function FoodPortionEditor({
  idPrefix,
  label,
  addLabel,
  placeholderName,
  placeholderAmount,
  items,
  onChange,
}: {
  idPrefix: string;
  label: string;
  addLabel: string;
  placeholderName: string;
  placeholderAmount: string;
  items: Array<{ name: string; approximateAmount: string }>;
  onChange: (items: Array<{ name: string; approximateAmount: string }>) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-cyan-950">{label}</p>
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id={`${idPrefix}-${index}-name`}
            className="input sm:flex-1"
            placeholder={placeholderName}
            aria-label={`${label} ${index + 1}`}
            value={item.name}
            onChange={(event) =>
              onChange(
                items.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)),
              )
            }
          />
          <input
            id={`${idPrefix}-${index}-amount`}
            className="input sm:flex-1"
            placeholder={placeholderAmount}
            aria-label={`Cantidad aproximada ${index + 1}`}
            value={item.approximateAmount}
            onChange={(event) =>
              onChange(
                items.map((row, i) =>
                  i === index ? { ...row, approximateAmount: event.target.value } : row,
                ),
              )
            }
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" aria-hidden />
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost gap-2"
        onClick={() => onChange([...items, { ...EMPTY_FOOD_PORTION }])}
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

function NutritionBlockEditor({
  idPrefix,
  title,
  block,
  onChange,
}: {
  idPrefix: string;
  title: string;
  block: NutritionBlock;
  onChange: (block: NutritionBlock) => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <FormField id={`${idPrefix}-targets`} label={title}>
        <textarea
          id={`${idPrefix}-targets`}
          className="input mt-3"
          rows={2}
          placeholder="Metas (gramos, %, frecuencia)"
          value={block.targets}
          onChange={(event) => onChange({ ...block, targets: event.target.value })}
        />
      </FormField>
      {block.sources.map((source, index) => (
        <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3">
          <FormField id={`${idPrefix}-source-${index}-nutrient`} label="Nutriente">
            <input
              id={`${idPrefix}-source-${index}-nutrient`}
              className="input"
              placeholder="Ej: Proteína"
              value={source.nutrient}
              onChange={(event) =>
                onChange({
                  ...block,
                  sources: block.sources.map((row, i) =>
                    i === index ? { ...row, nutrient: event.target.value } : row,
                  ),
                })
              }
            />
          </FormField>
          <FormField id={`${idPrefix}-source-${index}-amount`} label="Meta del nutriente">
            <input
              id={`${idPrefix}-source-${index}-amount`}
              className="input"
              placeholder="Ej: 320 mg/día"
              value={source.amount ?? ''}
              onChange={(event) =>
                onChange({
                  ...block,
                  sources: block.sources.map((row, i) =>
                    i === index
                      ? { ...row, amount: event.target.value === '' ? null : event.target.value }
                      : row,
                  ),
                })
              }
            />
          </FormField>
          <FoodPortionEditor
            idPrefix={`${idPrefix}-source-${index}-foods`}
            label="Alimentos y cantidad aproximada"
            addLabel="Agregar alimento"
            placeholderName="Almendras"
            placeholderAmount="30 g — cubre ~25% de la meta"
            items={source.foods}
            onChange={(foods) =>
              onChange({
                ...block,
                sources: block.sources.map((row, i) => (i === index ? { ...row, foods } : row)),
              })
            }
          />
          <FoodPortionEditor
            idPrefix={`${idPrefix}-source-${index}-local`}
            label="Productos locales y cantidad aproximada"
            addLabel="Agregar producto"
            placeholderName="Cacao"
            placeholderAmount="15 g — cubre ~10% de la meta"
            items={source.localProducts}
            onChange={(localProducts) =>
              onChange({
                ...block,
                sources: block.sources.map((row, i) =>
                  i === index ? { ...row, localProducts } : row,
                ),
              })
            }
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
            onClick={() =>
              onChange({
                ...block,
                sources: block.sources.filter((_, i) => i !== index),
              })
            }
          >
            <Trash2 className="size-4" aria-hidden />
            Quitar fuente
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost gap-2"
        onClick={() => onChange({ ...block, sources: [...block.sources, { ...EMPTY_NUTRIENT_SOURCE }] })}
      >
        <Plus className="size-4" aria-hidden />
        Agregar fuente
      </button>
    </div>
  );
}
