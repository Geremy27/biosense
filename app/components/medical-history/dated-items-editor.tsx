import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { FieldError } from '~/components/forms/field-error';
import { FormField } from '~/components/forms/form-field';
import type { DatedHistoryItem } from '~/validation/medical-history';

type DatedItemsEditorProps = {
  id: string;
  label: string;
  description?: string;
  itemLabelPlaceholder: string;
  detailPlaceholder: string;
  defaultItems?: DatedHistoryItem[];
  error?: string;
};

const EMPTY_ITEM: DatedHistoryItem = {
  label: '',
  detail: null,
  from: '',
  to: null,
};

export function DatedItemsEditor({
  id,
  label,
  description,
  itemLabelPlaceholder,
  detailPlaceholder,
  defaultItems = [],
  error,
}: DatedItemsEditorProps) {
  const [items, setItems] = useState<DatedHistoryItem[]>(
    defaultItems.length > 0 ? defaultItems : [],
  );

  return (
    <FormField id={id} label={label}>
      {description ? <p className="mb-2 text-xs text-slate-500">{description}</p> : null}
      <input type="hidden" name={`${id}Json`} value={JSON.stringify(items)} />

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
            Sin registros. Agrega uno si aplica.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ítem {index + 1}
                </p>
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs"
                  onClick={() =>
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                  aria-label={`Eliminar ítem ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-1 md:col-span-2">
                  <span className="text-xs font-medium text-slate-600">Nombre</span>
                  <input
                    className="input"
                    value={item.label}
                    placeholder={itemLabelPlaceholder}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, label: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>

                <label className="block space-y-1 md:col-span-2">
                  <span className="text-xs font-medium text-slate-600">Detalle</span>
                  <input
                    className="input"
                    value={item.detail ?? ''}
                    placeholder={detailPlaceholder}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                detail: event.target.value === '' ? null : event.target.value,
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600">Desde</span>
                  <input
                    type="date"
                    className="input"
                    value={item.from}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, from: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600">
                    Hasta <span className="font-normal text-slate-400">(vacío = actualidad)</span>
                  </span>
                  <input
                    type="date"
                    className="input"
                    value={item.to ?? ''}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                to: event.target.value === '' ? null : event.target.value,
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="btn-ghost mt-3 gap-2"
        onClick={() => setItems((current) => [...current, { ...EMPTY_ITEM }])}
      >
        <Plus className="size-4" aria-hidden />
        Agregar
      </button>

      <FieldError message={error} />
    </FormField>
  );
}
