'use client';

/* eslint-disable @next/next/no-img-element -- vistas previas locales (blob:) antes de subir */
import type { Dispatch, SetStateAction } from 'react';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { Input, Select } from '@/components/ui/form';
import { Button } from '@/components/ui/button';

export type ColorRow = {
  key: string;
  mode: 'existing' | 'new';
  colorId: string;
  newName: string;
  newHex: string;
  price: string;
  files: { file: File; preview: string }[];
};

export const emptyColorRow = (): ColorRow => ({
  key: crypto.randomUUID(),
  mode: 'existing',
  colorId: '',
  newName: '',
  newHex: '#302B28',
  price: '',
  files: [],
});

/** Lista editable de colores del producto: color, precio propio opcional y fotos. */
export function ColorRowsEditor({
  rows,
  onChange,
  colors,
  disabled,
}: {
  rows: ColorRow[];
  onChange: Dispatch<SetStateAction<ColorRow[]>>;
  colors: { id: string; name: string; hex: string }[];
  disabled?: boolean;
}) {
  const update = (key: string, patch: Partial<ColorRow>) => onChange((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const taken = new Set(rows.map((r) => r.colorId).filter(Boolean));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const hex = row.mode === 'existing' ? colors.find((c) => c.id === row.colorId)?.hex : row.newHex;
        return (
          <div key={row.key} className="flex flex-col gap-3 rounded-md border border-line bg-ivory/50 p-3 md:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="size-5 rounded-full border border-line" style={{ backgroundColor: hex ?? 'transparent' }} aria-hidden />
                Color {index + 1}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    row.files.forEach((f) => URL.revokeObjectURL(f.preview));
                    onChange((prev) => prev.filter((r) => r.key !== row.key));
                  }}
                  disabled={disabled}
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-sand/50 hover:text-espresso"
                  aria-label={`Quitar color ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              {row.mode === 'existing' ? (
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Color
                  <Select
                    value={row.colorId}
                    onChange={(e) =>
                      e.target.value === '__new'
                        ? update(row.key, { mode: 'new', colorId: '' })
                        : update(row.key, { colorId: e.target.value })
                    }
                    disabled={disabled}
                  >
                    <option value="" disabled>
                      Elija un color
                    </option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id} disabled={taken.has(c.id) && c.id !== row.colorId}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__new">+ Otro color…</option>
                  </Select>
                </label>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">Color nuevo</span>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={row.newHex}
                      onChange={(e) => update(row.key, { newHex: e.target.value.toUpperCase() })}
                      className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-line bg-white p-1"
                      aria-label="Tono del color"
                      disabled={disabled}
                    />
                    <Input
                      value={row.newName}
                      onChange={(e) => update(row.key, { newName: e.target.value })}
                      placeholder="Nombre, ej. Rojo vino"
                      maxLength={40}
                      aria-label="Nombre del color"
                      disabled={disabled}
                    />
                    <Button variant="ghost" size="sm" className="h-11" onClick={() => update(row.key, { mode: 'existing' })} disabled={disabled}>
                      Lista
                    </Button>
                  </div>
                </div>
              )}
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>
                  Precio propio <span className="font-normal text-muted">(opcional)</span>
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={row.price}
                  onChange={(e) => update(row.key, { price: e.target.value })}
                  placeholder="Igual al producto"
                  disabled={disabled}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {row.files.map((f, i) => (
                <div key={f.preview} className="relative aspect-[4/5] w-20 overflow-hidden rounded-sm bg-sand/40">
                  <img src={f.preview} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(f.preview);
                      onChange((prev) => prev.map((r) => (r.key === row.key ? { ...r, files: r.files.filter((_, j) => j !== i) } : r)));
                    }}
                    className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-white/90 text-espresso"
                    aria-label="Quitar foto"
                    disabled={disabled}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <label
                className="inline-flex aspect-[4/5] w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-mocha/60 text-xs text-muted hover:border-espresso hover:text-espresso has-[:disabled]:opacity-50"
              >
                <ImagePlus className="size-5" aria-hidden />
                Fotos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  disabled={disabled}
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []).map((file) => ({ file, preview: URL.createObjectURL(file) }));
                    onChange((prev) => prev.map((r) => (r.key === row.key ? { ...r, files: [...r.files, ...picked].slice(0, 10) } : r)));
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        );
      })}
      <div>
        <Button variant="secondary" size="sm" onClick={() => onChange((prev) => [...prev, emptyColorRow()])} disabled={disabled || rows.length >= 30}>
          <Plus className="size-4" aria-hidden /> Agregar otro color
        </Button>
      </div>
    </div>
  );
}
