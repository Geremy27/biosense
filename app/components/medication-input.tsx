import { useState } from 'react';
import type { Medication } from '~/server/analyze-exam.server';

export function MedicationInput() {
  const [isTakingMedication, setIsTakingMedication] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', startingDate: '', dose: 0, frequency: '' },
  ]);

  const addMedication = () => {
    setMedications([...medications, { name: '', startingDate: '', dose: 0, frequency: '' }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isTakingMedication}
          onChange={(e) => {
            setIsTakingMedication(e.target.checked);
            if (!e.target.checked) {
              setMedications([{ name: '', startingDate: '', dose: 0, frequency: '' }]);
            }
          }}
          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-400 focus:ring-cyan-400 focus:ring-2"
        />
        <span className="text-white text-sm">
          ¿El paciente está tomando algún medicamento/suplemento?
        </span>
      </label>

      {isTakingMedication && (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Medicamentos/Suplementos</span>
            <button
              type="button"
              onClick={addMedication}
              className="px-3 py-1.5 bg-cyan-400 text-gray-900 font-semibold rounded-lg text-xs sm:text-sm hover:opacity-80"
            >
              + Agregar
            </button>
          </div>

          {medications.map((medication, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 p-4 bg-gray-900 rounded-lg border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  Medicamento/Suplemento {index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="px-2 py-1 text-red-400 hover:text-red-300 text-xs"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-300 text-xs sm:text-sm">Nombre</label>
                  <input
                    type="text"
                    value={medication.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="Nombre del medicamento/suplemento"
                    className="p-2 border border-gray-600 rounded-md text-sm bg-gray-800 text-white ring-0 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-300 text-xs sm:text-sm">Fecha de inicio</label>
                  <input
                    type="date"
                    value={medication.startingDate}
                    onChange={(e) => updateMedication(index, 'startingDate', e.target.value)}
                    className="p-2 border border-gray-600 rounded-md text-sm bg-gray-800 text-white ring-0 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-300 text-xs sm:text-sm">Dosis</label>
                  <input
                    type="number"
                    value={medication.dose || ''}
                    onChange={(e) =>
                      updateMedication(index, 'dose', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Dosis"
                    min="0"
                    step="0.01"
                    className="p-2 border border-gray-600 rounded-md text-sm bg-gray-800 text-white ring-0 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-300 text-xs sm:text-sm">Frecuencia</label>
                  <input
                    type="text"
                    value={medication.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    placeholder="Ej: 2 veces al día"
                    className="p-2 border border-gray-600 rounded-md text-sm bg-gray-800 text-white ring-0 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Hidden inputs to submit medication data */}
          <input type="hidden" name="is_taking_medication" value={String(isTakingMedication)} />
          <input
            type="hidden"
            name="medications"
            value={JSON.stringify(
              medications.filter(
                (med) => med.name.trim() || med.startingDate || med.dose || med.frequency.trim(),
              ),
            )}
          />
        </div>
      )}
    </div>
  );
}
