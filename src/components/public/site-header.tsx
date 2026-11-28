'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { AUDIENCES } from '@/lib/icons';
import { cn } from '@/lib/cn';

const pills = [
  // «Todo» es la pantalla principal: así siempre hay un botón visible para volver al inicio.
  { href: '/', label: 'Todo', Icon: Sparkles },
  { href: '/mujer', label: 'Mujer', Icon: AUDIENCES.women.Icon },
  { href: '/hombre', label: 'Hombre', Icon: AUDIENCES.men.Icon },
  { href: '/novedades', label: 'Novedades', Icon: null },
] as const;

/** Encabezado con estado de navegación (ruta activa). Va dentro de <Suspense>. */
export function SiteHeader({ storeName, instagram }: { storeName: string; instagram: string | null }) {
  const pathname = usePathname();
  return <HeaderView storeName={storeName} instagram={instagram} pathname={pathname} />;
}

/** Versión estática para el respaldo de <Suspense> (prerender): misma apariencia, sin ruta activa. */
export function SiteHeaderStatic({ storeName, instagram }: { storeName: string; instagram: string | null }) {
  return <HeaderView storeName={storeName} instagram={instagram} pathname={null} />;
}

function HeaderView({ storeName, instagram, pathname }: { storeName: string; instagram: string | null; pathname: string | null }) {
  const isActive = (href: string) =>
    pathname !== null && (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/92 backdrop-blur-md">
      <div className="container-page">
        <div className="flex h-16 items-center gap-3 md:h-[68px] md:gap-6">
          <Link href="/" className="mr-auto py-2" aria-label={`${storeName}, inicio`}>
            <Logo name={storeName} className="text-[1.5rem] md:text-[1.75rem]" />
          </Link>

          <form action="/catalogo" role="search" className="hidden w-full max-w-sm md:block">
            <label htmlFor="header-search" className="sr-only">
              Buscar prendas
            </label>
            <div className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-muted focus-within:border-espresso">
              <Search className="size-4 shrink-0" aria-hidden />
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder="Buscar prendas…"
                className="w-full bg-transparent text-[0.9375rem] text-espresso placeholder:text-muted focus:outline-none"
              />
            </div>
          </form>

          <Link
            href="/catalogo#buscar"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-sand/40 md:hidden"
            aria-label="Buscar productos"
          >
            <Search className="size-5" />
          </Link>
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-sand/40"
              aria-label="Instagram"
            >
              <InstagramIcon className="size-5" />
            </a>
          )}
        </div>

        <nav aria-label="Principal" className="-mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:px-0">
          <ul className="flex gap-1.5">
            {pills.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[0.9375rem] transition-colors duration-200',
                      active ? 'bg-espresso text-white' : 'text-muted hover:bg-sand/40 hover:text-espresso',
                    )}
                  >
                    {Icon && <Icon className="size-4" aria-hidden strokeWidth={1.5} />}
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
