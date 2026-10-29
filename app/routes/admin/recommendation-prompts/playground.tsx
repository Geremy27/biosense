import { FlaskConical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Form, useActionData } from 'react-router';

import { pageTitle } from '~/brand';
import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import { RecommendationOutputView } from '~/components/recommendations/recommendation-output-view';
import { FieldError } from '~/components/forms/field-error';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import type { LabSnapshot, DeidentifiedPatientSnapshot } from '~/services/clinical-recommendation-snapshots';
import {
  buildClinicalUserPrompt,
} from '~/services/clinical-recommendations.service';
import { generateRecommendationOutput } from '~/services/recommendation-generation.service';
import { listActiveRecommendationPromptsForProvider } from '~/services/recommendation-prompts.service';
import { asRecommendationOutput } from '~/validation/recommendations';
import { buildActorContext } from '~/utils/session.server';
import { requirePlatformAdmin } from '~/utils/session.server';

import type { Route } from './+types/playground';

// ---------------------------------------------------------------------------
// Preset dummy patients for quick filling
// ---------------------------------------------------------------------------
const PRESETS = [
  {
    label: 'Mujer 42 años — panel hormonal',
    patient: {
      ageYears: 42,
      sex: 'Femenino',
      ethnicity: null,
      heightCm: '162',
      weightKg: '67',
      bmi: 25.5,
      residencePlace: 'Bogotá',
      residenceRegion: null,
    } satisfies DeidentifiedPatientSnapshot,
    medicalHistory: 'Fatiga, ciclos irregulares, ansiedad leve. Sin cirugías previas. Medicación actual: ninguna.',
    analytes: [
      { name: 'TSH', value: '3.8', unit: 'µUI/mL', referenceRange: '0.4–4.0', optimalRange: '0.45–2 µUI/mL', flag: 'SUBÓPTIMO' },
      { name: 'T4 Libre', value: '1.1', unit: 'ng/mL', referenceRange: '0.8–1.8', optimalRange: '1.3–1.8 ng/mL', flag: 'SUBÓPTIMO' },
      { name: 'T3 Libre', value: '2.9', unit: 'pg/mL', referenceRange: '2.0–4.4', optimalRange: '3.3–4.5 pg/mL', flag: 'SUBÓPTIMO' },
      { name: 'Estradiol (E2)', value: '42', unit: 'pg/mL', referenceRange: '20–400', optimalRange: '50–101 pg/mL día 3–5', flag: 'SUBÓPTIMO' },
      { name: 'Progesterona', value: '8.2', unit: 'ng/mL', referenceRange: '5–25', optimalRange: '13–23 ng/mL día 21', flag: 'SUBÓPTIMO' },
      { name: 'Ferritina', value: '18', unit: 'ng/mL', referenceRange: '10–120', optimalRange: '70–100 ng/mL', flag: 'SUBÓPTIMO' },
      { name: 'Vitamina D3', value: '28', unit: 'ng/mL', referenceRange: '20–100', optimalRange: '≥ 50 ng/mL', flag: 'SUBÓPTIMO' },
    ],
  },
  {
    label: 'Hombre 55 años — riesgo cardiometabólico',
    patient: {
      ageYears: 55,
      sex: 'Masculino',
      ethnicity: null,
      heightCm: '175',
      weightKg: '95',
      bmi: 31.0,
      residencePlace: 'Medellín',
      residenceRegion: null,
    } satisfies DeidentifiedPatientSnapshot,
    medicalHistory: 'HTA leve controlada con Losartán 50 mg/día. Sedentario. Snoring nocturno.',
    analytes: [
      { name: 'Glucosa en ayuno', value: '105', unit: 'mg/dL', referenceRange: '70–100', optimalRange: '80–87 mg/dL', flag: 'FUERA DE RANGO ÓPTIMO' },
      { name: 'HbA1c', value: '5.9', unit: '%', referenceRange: '< 6.5', optimalRange: '< 5.3%', flag: 'SUBÓPTIMO' },
      { name: 'Insulina en ayuno', value: '14', unit: 'µUI/mL', referenceRange: '< 25', optimalRange: '2–5 µUI/mL', flag: 'SUBÓPTIMO' },
      { name: 'Triglicéridos', value: '210', unit: 'mg/dL', referenceRange: '< 150', optimalRange: '50–75 mg/dL', flag: 'FUERA DE RANGO ÓPTIMO' },
      { name: 'HDL', value: '38', unit: 'mg/dL', referenceRange: '> 40', optimalRange: '50–70 mg/dL', flag: 'FUERA DE RANGO ÓPTIMO' },
      { name: 'LDL', value: '148', unit: 'mg/dL', referenceRange: '< 160', optimalRange: '90–115 mg/dL', flag: 'SUBÓPTIMO' },
      { name: 'PCR-us', value: '3.2', unit: 'mg/L', referenceRange: '< 5.0', optimalRange: '< 1 mg/L', flag: 'SUBÓPTIMO' },
      { name: 'Testosterona Total', value: '380', unit: 'ng/dL', referenceRange: '300–1000', optimalRange: '550–1000 ng/dL', flag: 'SUBÓPTIMO' },
    ],
  },
  {
    label: 'Mujer 35 años — fatiga y anemia',
    patient: {
      ageYears: 35,
      sex: 'Femenino',
      ethnicity: null,
      heightCm: '158',
      weightKg: '54',
      bmi: 21.6,
      residencePlace: 'Cali',
      residenceRegion: null,
    } satisfies DeidentifiedPatientSnapshot,
    medicalHistory: 'Fatiga persistente, cabello frágil, ciclos abundantes. Dieta vegetariana. Suplementa con vitamina C ocasional.',
    analytes: [
      { name: 'Hemoglobina', value: '11.2', unit: 'g/dL', referenceRange: '12–16', optimalRange: '13.5–14.5 g/dL', flag: 'FUERA DE RANGO ÓPTIMO' },
      { name: 'Ferritina', value: '8', unit: 'ng/mL', referenceRange: '10–120', optimalRange: '70–100 ng/mL', flag: 'FUERA DE RANGO ÓPTIMO' },
      { name: 'Hierro Sérico', value: '55', unit: 'mg/dL', referenceRange: '50–170', optimalRange: '80–99 mg/dL', flag: 'SUBÓPTIMO' },
      { name: 'Vitamina B12', value: '230', unit: 'pg/mL', referenceRange: '200–950', optimalRange: '> 500 pg/mL', flag: 'SUBÓPTIMO' },
      { name: 'Folato Sérico', value: '5.2', unit: 'ng/mL', referenceRange: '3–20', optimalRange: '> 8 ng/mL', flag: 'SUBÓPTIMO' },
      { name: 'Vitamina D3', value: '19', unit: 'ng/mL', referenceRange: '20–100', optimalRange: '≥ 50 ng/mL', flag: 'FUERA DE RANGO ÓPTIMO' },
      { name: 'TSH', value: '3.1', unit: 'µUI/mL', referenceRange: '0.4–4.0', optimalRange: '0.45–2 µUI/mL', flag: 'SUBÓPTIMO' },
    ],
  },
] as const;

type Analyte = {
  name: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  optimalRange: string | null;
  flag: string | null;
};

const EMPTY_ANALYTE: Analyte = {
  name: '',
  value: '',
  unit: null,
  referenceRange: null,
  optimalRange: null,
  flag: null,
};

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------
export async function loader({ request }: Route.LoaderArgs) {
  await requirePlatformAdmin(request);
  const ctx = await buildActorContext(request);

  // Re-use the existing service that lists prompts visible to providers;
  // admins can see/test all of them.
  const prompts = await listActiveRecommendationPromptsForProvider(ctx);

  return { prompts };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: pageTitle('Playground de prompts') }];
}

// ---------------------------------------------------------------------------
// Action — runs the generation and returns the result without saving anything
// ---------------------------------------------------------------------------
export async function action({ request }: Route.ActionArgs) {
  await requirePlatformAdmin(request);

  const formData = await request.formData();

  try {
    const patientSnapshot: DeidentifiedPatientSnapshot = {
      ageYears: Number(formData.get('ageYears')) || 30,
      sex: String(formData.get('sex') || '').trim() || null,
      ethnicity: String(formData.get('ethnicity') || '').trim() || null,
      heightCm: String(formData.get('heightCm') || '').trim() || null,
      weightKg: String(formData.get('weightKg') || '').trim() || null,
      bmi: Number(formData.get('bmi')) || null,
      residencePlace: String(formData.get('residencePlace') || 'Colombia'),
      residenceRegion: String(formData.get('residenceRegion') || '').trim() || null,
    };

    const medicalHistoryText = String(formData.get('medicalHistoryText') || '').trim() || null;

    const analytesJson = String(formData.get('analytesJson') || '[]');
    const parsedAnalytes: Analyte[] = JSON.parse(analytesJson);

    const labSnapshot: LabSnapshot = {
      collectedAt: String(formData.get('collectedAt') || '').trim() || null,
      labName: String(formData.get('labName') || '').trim() || null,
      panelName: String(formData.get('panelName') || '').trim() || null,
      analytes: parsedAnalytes.filter((a) => a.name && a.value),
    };

    if (labSnapshot.analytes.length === 0) {
      return { errors: { _form: 'Agrega al menos un analito con nombre y valor.' }, output: null, rawJson: null };
    }

    const model = String(formData.get('model') || 'gpt-4o').trim();
    const systemPrompt = String(formData.get('systemPrompt') || '').trim();
    const instructions = String(formData.get('instructions') || '').trim();

    if (!systemPrompt || !instructions) {
      return { errors: { _form: 'El system prompt y las instrucciones son obligatorios.' }, output: null, rawJson: null };
    }

    // Build a minimal medical history snapshot only from the free-text field
    const medicalHistorySnapshot = medicalHistoryText
      ? {
          title: 'Historial de prueba',
          recordedAt: new Date().toISOString().slice(0, 10),
          chiefComplaint: medicalHistoryText,
          personalHistory1: [],
          personalHistory2: [],
          surgicalHistory: [],
          medications: [],
          supplements: [],
          diet: [],
          infectiousHistory: null,
          traumaticHistory: null,
          toxicologicalHistory: [],
          allergies: null,
          vaccines: null,
          habits: null,
          gynecoObstetricHistory: null,
          familyHistory: null,
          psychosocialHistory: null,
          notes: null,
        }
      : null;

    const userPrompt = buildClinicalUserPrompt({
      patientSnapshot,
      labSnapshot,
      medicalHistorySnapshot,
      medicationsText: null,
      localFoods: [],
      instructions,
    });

    const generated = await generateRecommendationOutput({
      systemPrompt,
      userPrompt,
      model,
    });

    const { model: _m, ...outputData } = generated;
    const rawJson = JSON.stringify(outputData, null, 2);
    const output = asRecommendationOutput(outputData);

    return { errors: null, output, rawJson };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error inesperado al ejecutar el playground.';
    return { errors: { _form: message }, output: null, rawJson: null };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PromptPlayground({ loaderData }: Route.ComponentProps) {
  const { prompts } = loaderData;
  const actionData = useActionData<typeof action>();

  const firstPrompt = prompts[0];

  const [selectedPromptId, setSelectedPromptId] = useState(firstPrompt?.id ?? '');
  const [model, setModel] = useState(firstPrompt?.model ?? 'gpt-4o');
  const [systemPrompt, setSystemPrompt] = useState(firstPrompt?.systemPrompt ?? '');
  const [instructions, setInstructions] = useState(firstPrompt?.userPromptTemplate ?? '');

  // Patient fields
  const [ageYears, setAgeYears] = useState('');
  const [sex, setSex] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [residencePlace, setResidencePlace] = useState('Bogotá');
  const [medicalHistoryText, setMedicalHistoryText] = useState('');

  // Lab metadata
  const [labName, setLabName] = useState('');
  const [panelName, setPanelName] = useState('');
  const [collectedAt, setCollectedAt] = useState('');

  // Analytes
  const [analytes, setAnalytes] = useState<Analyte[]>([{ ...EMPTY_ANALYTE }]);

  // Raw JSON panel
  const [showRaw, setShowRaw] = useState(false);

  function applyPreset(index: number) {
    const p = PRESETS[index];
    setAgeYears(String(p.patient.ageYears));
    setSex(p.patient.sex ?? '');
    setHeightCm(p.patient.heightCm ?? '');
    setWeightKg(p.patient.weightKg ?? '');
    setResidencePlace(p.patient.residencePlace ?? 'Bogotá');
    setMedicalHistoryText(p.medicalHistory);
    setAnalytes(p.analytes.map((a) => ({ ...a })));
  }

  function selectPrompt(id: string) {
    const p = prompts.find((r) => r.id === id);
    if (!p) return;
    setSelectedPromptId(id);
    setModel(p.model);
    setSystemPrompt(p.systemPrompt);
    setInstructions(p.userPromptTemplate);
  }

  function updateAnalyte(index: number, field: keyof Analyte, value: string) {
    setAnalytes((curr) =>
      curr.map((a, i) => (i === index ? { ...a, [field]: value || null } : a)),
    );
  }

  return (
    <div className="w-full max-w-7xl space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/admin' },
          { label: 'Prompts', to: '/admin/recommendation-prompts' },
          { label: 'Playground' },
        ]}
      />
      <PageHeader
        eyebrow="Administración"
        title="Playground de prompts"
        description="Prueba cualquier combinación de modelo, system prompt e instrucciones con datos ficticios. Nada se guarda en la base de datos."
      />

      <Form method="post" className="space-y-8">
        <input type="hidden" name="analytesJson" value={JSON.stringify(analytes)} />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── LEFT: patient + lab inputs ── */}
          <div className="space-y-6">
            {/* Presets */}
            <section className="card space-y-3">
              <div>
                <h3 className="text-lg font-bold text-cyan-950">Paciente de prueba</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Rellena con un preset o escribe tus propios datos.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn-ghost gap-2 text-xs"
                    onClick={() => applyPreset(i)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField id="ageYears" label="Edad (años)">
                  <input
                    id="ageYears"
                    name="ageYears"
                    type="number"
                    min="1"
                    max="120"
                    className="input"
                    value={ageYears}
                    onChange={(e) => setAgeYears(e.target.value)}
                    required
                  />
                </FormField>

                <FormField id="sex" label="Sexo">
                  <select
                    id="sex"
                    name="sex"
                    className="input"
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                  >
                    <option value="">No especificado</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </FormField>

                <FormField id="heightCm" label="Talla (cm)">
                  <input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    step="0.1"
                    className="input"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </FormField>

                <FormField id="weightKg" label="Peso (kg)">
                  <input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    step="0.1"
                    className="input"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </FormField>

                <FormField id="residencePlace" label="Ciudad de residencia">
                  <input
                    id="residencePlace"
                    name="residencePlace"
                    className="input"
                    value={residencePlace}
                    onChange={(e) => setResidencePlace(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField id="medicalHistoryText" label="Antecedentes / motivo de consulta (libre)">
                <textarea
                  id="medicalHistoryText"
                  name="medicalHistoryText"
                  rows={3}
                  className="input"
                  placeholder="Ej. Fatiga crónica, hipotiroidismo subclínico, medicación: Levotiroxina 50 µg/día"
                  value={medicalHistoryText}
                  onChange={(e) => setMedicalHistoryText(e.target.value)}
                />
              </FormField>
            </section>

            {/* Lab metadata */}
            <section className="card space-y-3">
              <h3 className="text-lg font-bold text-cyan-950">Laboratorio</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField id="labName" label="Laboratorio">
                  <input
                    id="labName"
                    name="labName"
                    className="input"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="Ej. Laboratorio Clínico"
                  />
                </FormField>
                <FormField id="panelName" label="Panel">
                  <input
                    id="panelName"
                    name="panelName"
                    className="input"
                    value={panelName}
                    onChange={(e) => setPanelName(e.target.value)}
                    placeholder="Ej. Perfil hormonal"
                  />
                </FormField>
                <FormField id="collectedAt" label="Fecha de toma">
                  <input
                    id="collectedAt"
                    name="collectedAt"
                    type="date"
                    className="input"
                    value={collectedAt}
                    onChange={(e) => setCollectedAt(e.target.value)}
                  />
                </FormField>
              </div>

              {/* Analytes table */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-sm font-semibold text-cyan-950">Analitos</p>
                <button
                  type="button"
                  className="btn-ghost gap-2 text-xs"
                  onClick={() => setAnalytes((curr) => [...curr, { ...EMPTY_ANALYTE }])}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Agregar fila
                </button>
              </div>

              <div className="space-y-2">
                {analytes.map((analyte, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border border-slate-200 p-3"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr 2fr 1.5fr auto' }}
                  >
                    <input
                      className="input text-sm"
                      placeholder="Parámetro"
                      value={analyte.name}
                      onChange={(e) => updateAnalyte(index, 'name', e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Valor"
                      value={analyte.value}
                      onChange={(e) => updateAnalyte(index, 'value', e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Unidad"
                      value={analyte.unit ?? ''}
                      onChange={(e) => updateAnalyte(index, 'unit', e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Rango referencia"
                      value={analyte.referenceRange ?? ''}
                      onChange={(e) => updateAnalyte(index, 'referenceRange', e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Rango óptimo"
                      value={analyte.optimalRange ?? ''}
                      onChange={(e) => updateAnalyte(index, 'optimalRange', e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Flag"
                      value={analyte.flag ?? ''}
                      onChange={(e) => updateAnalyte(index, 'flag', e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      aria-label="Quitar analito"
                      onClick={() =>
                        setAnalytes((curr) => curr.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
                {analytes.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-400">
                    Sin analitos todavía. Agrega al menos uno o usa un preset.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ── RIGHT: prompt config ── */}
          <div className="space-y-6">
            <section className="card space-y-4">
              <div>
                <h3 className="text-lg font-bold text-cyan-950">Configuración del modelo</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Elige un prompt base y edítalo libremente. Los cambios son solo para esta
                  ejecución — el prompt guardado no se modifica.
                </p>
              </div>

              <FormField id="promptPicker" label="Prompt base">
                <select
                  id="promptPicker"
                  className="input"
                  value={selectedPromptId}
                  onChange={(e) => selectPrompt(e.target.value)}
                >
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isActive ? '(activo)' : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField id="model" label="Modelo">
                <input
                  id="model"
                  name="model"
                  className="input font-mono text-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  placeholder="gpt-4o"
                />
                <FieldError message={undefined} />
              </FormField>

              <FormField id="systemPrompt" label="System prompt">
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  rows={8}
                  className="input font-mono text-sm"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  required
                />
                <FieldError message={undefined} />
              </FormField>

              <FormField id="instructions" label="Instrucciones (user prompt)">
                <textarea
                  id="instructions"
                  name="instructions"
                  rows={16}
                  className="input font-mono text-sm"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Demografía, analitos y antecedentes se inyectan automáticamente antes de estas
                  instrucciones.
                </p>
                <FieldError message={undefined} />
              </FormField>
            </section>
          </div>
        </div>

        {actionData?.errors?._form ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionData.errors._form}
          </p>
        ) : null}

        <FormPendingFieldset>
          <SubmitButton loadingLabel="Ejecutando…">
            <FlaskConical className="size-4" aria-hidden />
            Ejecutar playground
          </SubmitButton>
        </FormPendingFieldset>
      </Form>

      {/* ── OUTPUT ── */}
      {actionData?.output ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-bold text-cyan-950">Resultado</h2>
            <button
              type="button"
              className="btn-ghost gap-2 text-sm"
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? 'Ver formato visual' : 'Ver JSON crudo'}
            </button>
          </div>

          {showRaw ? (
            <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
              {actionData.rawJson}
            </pre>
          ) : (
            <RecommendationOutputView output={actionData.output} audience="provider" />
          )}
        </section>
      ) : null}
    </div>
  );
}
