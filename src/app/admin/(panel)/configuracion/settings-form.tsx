'use client';

import { useFormAction } from '@/components/ui/use-form-action';
import { saveSettings } from '@/lib/actions/settings';
import { Panel } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FormMessage, Input, Textarea } from '@/components/ui/form';
import type { Database } from '@/types/database';

type Settings = Database['public']['Tables']['store_settings']['Row'];

export function SettingsForm({ settings: s, readOnly }: { settings: Settings; readOnly: boolean }) {
  const [state, onSubmit, pending] = useFormAction(saveSettings);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const e = (k: string) => fe?.[k]?.[0];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset disabled={readOnly || pending} className="flex flex-col gap-6">
        <Panel title="Marca">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombre de la tienda" htmlFor="store_name" error={e('store_name')}>
              <Input id="store_name" name="store_name" defaultValue={s.store_name} maxLength={80} required />
            </Field>
            <Field label="Eslogan" htmlFor="slogan" optional error={e('slogan')} hint="Aparece en la portada.">
              <Input id="slogan" name="slogan" defaultValue={s.slogan ?? ''} maxLength={160} />
            </Field>
            <Field label="Descripción breve" htmlFor="description" optional error={e('description')} className="md:col-span-2">
              <Textarea id="description" name="description" defaultValue={s.description ?? ''} maxLength={500} />
            </Field>
            <Field label="Texto de «Nosotros»" htmlFor="about_text" optional error={e('about_text')} className="md:col-span-2">
              <Textarea id="about_text" name="about_text" defaultValue={s.about_text ?? ''} maxLength={5000} rows={6} />
            </Field>
          </div>
        </Panel>

        <Panel title="Contacto">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Instagram" htmlFor="instagram_handle" optional error={e('instagram_handle')} hint="Solo el usuario, sin @.">
              <Input id="instagram_handle" name="instagram_handle" defaultValue={s.instagram_handle ?? ''} maxLength={31} />
            </Field>
            <Field label="Correo" htmlFor="contact_email" optional error={e('contact_email')}>
              <Input id="contact_email" name="contact_email" type="email" defaultValue={s.contact_email ?? ''} />
            </Field>
            <Field label="Teléfono" htmlFor="contact_phone" optional error={e('contact_phone')}>
              <Input id="contact_phone" name="contact_phone" defaultValue={s.contact_phone ?? ''} maxLength={30} />
            </Field>
            <Field label="Número de WhatsApp" htmlFor="whatsapp_number" optional error={e('whatsapp_number')} hint="Formato internacional, ej. +5215512345678.">
              <Input id="whatsapp_number" name="whatsapp_number" defaultValue={s.whatsapp_number ?? ''} inputMode="tel" />
            </Field>
            <Checkbox name="whatsapp_enabled" defaultChecked={s.whatsapp_enabled} label="Mostrar botón «Pedir por WhatsApp» en los productos" className="md:col-span-2" />
          </div>
        </Panel>

        <Panel title="Catálogo">
          <div className="grid gap-5 md:grid-cols-2">
            <Checkbox name="show_sold_out_products" defaultChecked={s.show_sold_out_products} label="Mostrar productos agotados (con etiqueta «Agotado»)" className="md:col-span-2" />
            <Field label="Umbral de pocas existencias" htmlFor="low_stock_threshold" error={e('low_stock_threshold')} hint="Con esta cantidad o menos se muestra «Últimas piezas».">
              <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min={0} max={100} defaultValue={s.low_stock_threshold} />
            </Field>
            <Field label="Moneda" htmlFor="currency" hint="Los precios se muestran en pesos mexicanos.">
              <Input id="currency" value={s.currency} disabled readOnly />
            </Field>
          </div>
        </Panel>

        <Panel title="Apartados">
          <div className="grid gap-5 md:grid-cols-2">
            <Checkbox
              name="reservations_hold_stock"
              defaultChecked={s.reservations_hold_stock}
              label="Los apartados retienen las unidades (no se pueden vender mientras estén apartadas)"
              className="md:col-span-2"
            />
            <Field label="Plazo sugerido (días)" htmlFor="reservation_default_days" optional error={e('reservation_default_days')} hint="Fecha límite propuesta al crear un apartado.">
              <Input id="reservation_default_days" name="reservation_default_days" type="number" min={1} max={90} defaultValue={s.reservation_default_days ?? ''} />
            </Field>
          </div>
          <p className="mt-3 text-sm text-muted">El cambio de política aplica a los apartados nuevos; los existentes conservan la regla con la que se crearon.</p>
        </Panel>

        <Panel title="Entrega y recolección">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Información de entrega" htmlFor="delivery_info" optional error={e('delivery_info')}>
              <Textarea id="delivery_info" name="delivery_info" defaultValue={s.delivery_info ?? ''} maxLength={2000} />
            </Field>
            <Field label="Información de recolección" htmlFor="pickup_info" optional error={e('pickup_info')}>
              <Textarea id="pickup_info" name="pickup_info" defaultValue={s.pickup_info ?? ''} maxLength={2000} />
            </Field>
          </div>
        </Panel>
      </fieldset>

      {state && !state.ok && <FormMessage tone="error">{state.error}</FormMessage>}
      {state?.ok && state.message && <FormMessage tone="success">{state.message}</FormMessage>}
      {!readOnly && (
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar configuración'}
          </Button>
        </div>
      )}
    </form>
  );
}
