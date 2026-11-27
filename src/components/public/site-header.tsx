'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/cn';

const primaryNav = [
  { href: '/mujer', label: 'Mujer' },
  { href: '/hombre', label: 'Hombre' },
  { href: '/novedades', label: 'Novedades' },
  { href: '/catalogo', label: 'Catálogo' },
];

const secondaryNav = [
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

/** Encabezado con estado de navegación (ruta activa, menú móvil). Va dentro de <Suspense>. */
export function SiteHeader({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  return <HeaderView storeName={storeName} pathname={pathname} />;
}

/** Versión estática para el respaldo de <Suspense> (prerender): misma apariencia, sin ruta activa. */
export function SiteHeaderStatic({ storeName }: { storeName: string }) {
  return <HeaderView storeName={storeName} pathname={null} />;
}

function HeaderView({ storeName, pathname }: { storeName: string; pathname: string | null }) {
  // El menú queda abierto solo en la ruta donde se abrió: al navegar se cierra solo.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = pathname !== null && openOn === pathname;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <button
          type="button"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-md md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>

        <Link href="/" className="py-2" aria-label={`${storeName}, inicio`}>
          <Logo name={storeName} className="text-[1.5rem] md:text-[1.75rem]" />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'relative py-2 text-[0.9375rem] transition-colors duration-200 hover:text-espresso',
                    'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-espresso after:transition-transform after:duration-200',
                    isActive(item.href) ? 'text-espresso after:scale-x-100' : 'text-muted after:scale-x-0 hover:after:scale-x-100',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/catalogo#buscar"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-md hover:bg-sand/40"
          aria-label="Buscar productos"
        >
          <Search className="size-5" />
        </Link>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-40 animate-fade-in overflow-y-auto bg-ivory md:hidden"
      >
        <nav aria-label="Menú móvil" className="container-page flex flex-col py-8">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className="font-display border-b border-line py-4 text-[2rem] leading-tight"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-8 flex gap-6">
            {secondaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="py-2 text-muted">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
