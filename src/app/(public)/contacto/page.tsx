import type { Metadata } from 'next';
import { AtSign, Mail, MessageCircle, Phone } from 'lucide-react';
import { EmptyState } from '@/components/ui/misc';
import { getSettings } from '@/lib/queries/catalog';
import { whatsappLink } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbenos para preguntar por un producto, apartarlo o coordinar la entrega.',
  alternates: { canonical: '/contacto' },
};

export default async function ContactPage() {
  const s = await getSettings();
  const channels = [
    s.whatsapp_enabled && s.whatsapp_number
      ? {
          icon: MessageCircle,
          label: 'WhatsApp',
          value: s.whatsapp_number,
          href: whatsappLink(s.whatsapp_number, `Hola ${s.store_name}, tengo una pregunta.`),
          external: true,
        }
      : null,
    s.instagram_handle
      ? { icon: AtSign, label: 'Instagram', value: `@${s.instagram_handle}`, href: `https://instagram.com/${s.instagram_handle}`, external: true }
      : null,
    s.contact_email ? { icon: Mail, label: 'Correo', value: s.contact_email, href: `mailto:${s.contact_email}`, external: false } : null,
    s.contact_phone ? { icon: Phone, label: 'Teléfono', value: s.contact_phone, href: `tel:${s.contact_phone.replace(/[^+0-9]/g, '')}`, external: false } : null,
  ].filter((c) => c !== null);

  return (
    <div className="container-page pt-10 md:pt-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none lowercase">contacto</h1>
        <p className="mt-4 text-muted">Pregunta por un producto, apártalo o coordina la entrega directamente con nosotros.</p>
      </header>

      {channels.length === 0 ? (
        <EmptyState title="Pronto publicaremos nuestros datos de contacto" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          {channels.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex items-center gap-4 rounded-lg border border-line bg-white p-5 transition-colors duration-200 hover:border-mocha"
              >
                <c.icon className="size-6 shrink-0" aria-hidden />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm text-muted">{c.label}</span>
                  <span className="break-all">{c.value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {(s.delivery_info || s.pickup_info) && (
        <section className="mt-14 grid gap-8 md:grid-cols-2 lg:max-w-3xl" aria-label="Entrega y recolección">
          {s.delivery_info && (
            <div>
              <h2 className="font-display mb-2 text-2xl">Entrega</h2>
              <p className="whitespace-pre-line text-muted">{s.delivery_info}</p>
            </div>
          )}
          {s.pickup_info && (
            <div>
              <h2 className="font-display mb-2 text-2xl">Recolección</h2>
              <p className="whitespace-pre-line text-muted">{s.pickup_info}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
