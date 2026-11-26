'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowDownToLine,
  BookmarkCheck,
  Boxes,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Receipt,
  Settings,
  Shirt,
  Tags,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { signOut } from '@/lib/actions/auth';
import { cn } from '@/lib/cn';

const groups = [
  {
    label: 'Catálogo',
    items: [
      { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
      { href: '/admin/productos', label: 'Productos', icon: Shirt },
      { href: '/admin/categorias', label: 'Categorías', icon: Tags },
      { href: '/admin/atributos', label: 'Colores y tallas', icon: Palette },
    ],
  },
  {
    label: 'Operación',
    items: [
      { href: '/admin/inventario', label: 'Inventario', icon: Boxes },
      { href: '/admin/entradas', label: 'Entradas', icon: ArrowDownToLine },
      { href: '/admin/ventas', label: 'Ventas', icon: Receipt },
      { href: '/admin/apartados', label: 'Apartados', icon: BookmarkCheck },
      { href: '/admin/movimientos', label: 'Movimientos', icon: History },
    ],
  },
  {
    label: 'Tienda',
    items: [{ href: '/admin/configuracion', label: 'Configuración', icon: Settings }],
  },
];

export function AdminNav({ fullName, role }: { fullName: string; role: 'owner' | 'staff' }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav aria-label="Panel" className="flex flex-col gap-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1 px-3 text-xs text-muted">{g.label}</p>
          <ul>
            {g.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href, item.exact) ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors duration-150',
                    isActive(item.href, item.exact) ? 'bg-espresso text-white' : 'hover:bg-sand/50',
                  )}
                >
                  <item.icon className="size-[18px]" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <p className="truncate px-3 text-sm">{fullName}</p>
      <p className="px-3 text-xs text-muted">{role === 'owner' ? 'Owner' : 'Staff'}</p>
      <div className="flex flex-col">
        <Link href="/" className="flex h-10 items-center rounded-md px-3 text-sm hover:bg-sand/50" target="_blank">
          Ver sitio público
        </Link>
        <form action={signOut}>
          <button type="submit" className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm hover:bg-sand/50">
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-white px-3 py-6 lg:flex">
        <div className="flex flex-col gap-8">
          <Link href="/admin" className="px-3">
            <Logo />
          </Link>
          {nav}
        </div>
        {account}
      </aside>

      {/* Móvil */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpenOn(open ? null : pathname)}
          className="inline-flex size-11 items-center justify-center rounded-md"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        <Link href="/admin">
          <Logo className="text-xl" />
        </Link>
        <span className="size-11" />
      </header>
      <div
        id="admin-mobile-nav"
        hidden={!open}
        className="fixed inset-x-0 top-14 bottom-0 z-30 animate-fade-in overflow-y-auto bg-white px-3 py-6 lg:hidden"
      >
        <div className="flex flex-col gap-8">
          {nav}
          {account}
        </div>
      </div>
    </>
  );
}
