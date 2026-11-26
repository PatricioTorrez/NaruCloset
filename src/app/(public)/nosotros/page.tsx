import type { Metadata } from 'next';
import { LogoStacked } from '@/components/brand/logo';
import { ButtonLink } from '@/components/ui/button';
import { getSettings } from '@/lib/queries/catalog';

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Conoce Naru Closet, ropa para mujer y hombre.',
  alternates: { canonical: '/nosotros' },
};

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="container-page grid gap-12 pt-10 md:grid-cols-[1fr_1.2fr] md:pt-16">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none lowercase">nosotros</h1>
        {settings.slogan && <p className="font-display text-2xl italic text-muted">{settings.slogan}</p>}
      </div>
      <div className="flex flex-col gap-6">
        {settings.about_text ? (
          <div className="max-w-[62ch] whitespace-pre-line text-[1.0625rem] leading-[1.7]">{settings.about_text}</div>
        ) : (
          <div className="flex flex-col items-start gap-6 rounded-sm bg-white p-8">
            <LogoStacked />
            <p className="max-w-[52ch] text-muted">
              {settings.description ??
                `${settings.store_name} es una marca de ropa para mujer y hombre con un estilo cotidiano, cálido y versátil.`}
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/catalogo">Ver catálogo</ButtonLink>
          <ButtonLink href="/contacto" variant="secondary">
            Contacto
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
