'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateUserAccess } from '@/lib/actions/settings';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';

type User = { id: string; full_name: string; role: 'owner' | 'staff'; is_active: boolean };

export function UsersManager({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (id: string, values: Partial<Pick<User, 'role' | 'is_active'>>) =>
    startTransition(async () => {
      const r = await updateUserAccess(id, values);
      setError(r.ok ? null : r.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Los usuarios se invitan desde el panel de Supabase (Authentication → Users → Invite). Aparecen aquí inactivos hasta
        que los active. Staff opera catálogo, ventas, entradas y apartados; solo owner ve costos, ajusta inventario y cambia
        la configuración.
      </p>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <ul className="divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="min-w-0 flex-1 truncate">
              {u.full_name}
              {u.id === currentUserId && <span className="ml-2 text-sm text-muted">(usted)</span>}
            </span>
            <Badge tone={u.role === 'owner' ? 'sale' : 'neutral'}>{u.role === 'owner' ? 'Owner' : 'Staff'}</Badge>
            {u.is_active ? <Badge tone="success">Activo</Badge> : <Badge>Sin acceso</Badge>}
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(u.id, { is_active: !u.is_active })}>
                {u.is_active ? 'Quitar acceso' : 'Dar acceso'}
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(u.id, { role: u.role === 'owner' ? 'staff' : 'owner' })}>
                {u.role === 'owner' ? 'Hacer staff' : 'Hacer owner'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
