import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { env } from '@/lib/env';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: 'Naru Closet — Tu estilo, a tu manera.',
    template: '%s · Naru Closet',
  },
  description: 'Catálogo oficial de Naru Closet: ropa para mujer y hombre. Consulta precios, tallas, colores y disponibilidad.',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Naru Closet',
  },
};

export const viewport: Viewport = {
  themeColor: '#f5f1eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
