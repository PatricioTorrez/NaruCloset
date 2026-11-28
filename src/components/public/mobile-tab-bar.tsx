'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, LayoutGrid, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

const tabs = [
  { href: '/', label: 'Inicio', Icon: House, exact: true },
  { href: '/catalogo', label: 'Catálogo', Icon: LayoutGrid },
  { href: '/novedades', label: 'Novedades', Icon: Sparkles },
  { href: '/contacto', label: 'Contacto', Icon: MessageCircle },
];

/** Barra inferior de navegación, solo en teléfono. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] transition-colors duration-150',
                  active ? 'text-espresso' : 'text-muted',
                )}
              >
                <Icon className="size-5" aria-hidden strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
