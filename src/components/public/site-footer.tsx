import Link from 'next/link';
import { LogoStacked } from '@/components/brand/logo';
import type { PublicSettings } from '@/lib/queries/catalog';

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-4">
          <LogoStacked />
          {settings.slogan && <p className="font-display text-lg italic text-muted">{settings.slogan}</p>}
        </div>

        <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-6 gap-y-2 text-[0.9375rem]">
          <Link href="/mujer" className="py-1.5 hover:underline">Mujer</Link>
          <Link href="/nosotros" className="py-1.5 hover:underline">Nosotros</Link>
          <Link href="/hombre" className="py-1.5 hover:underline">Hombre</Link>
          <Link href="/contacto" className="py-1.5 hover:underline">Contacto</Link>
          <Link href="/novedades" className="py-1.5 hover:underline">Novedades</Link>
          <Link href="/catalogo" className="py-1.5 hover:underline">Catálogo</Link>
        </nav>

        <div className="flex flex-col gap-2 text-[0.9375rem]">
          {settings.instagram_handle && (
            <a
              href={`https://instagram.com/${settings.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 hover:underline"
            >
              Instagram @{settings.instagram_handle}
            </a>
          )}
          {settings.contact_email && (
            <a href={`mailto:${settings.contact_email}`} className="py-1.5 break-all hover:underline">
              {settings.contact_email}
            </a>
          )}
          {settings.contact_phone && <span className="py-1.5 text-muted">{settings.contact_phone}</span>}
        </div>
      </div>
      <div className="container-page border-t border-line py-6 text-[0.8125rem] text-muted">
        © {settings.store_name}
      </div>
    </footer>
  );
}
