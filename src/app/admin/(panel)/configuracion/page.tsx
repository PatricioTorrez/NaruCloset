import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { FormMessage } from '@/components/ui/form';
import { getAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from './settings-form';
import { UsersManager } from './users-manager';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Configuración' };

export default async function SettingsPage() {
  const admin = await getAdmin();
  const supabase = await createClient();
  const isOwner = admin?.role === 'owner';
  const [{ data: settings, error }, { data: users }] = await Promise.all([
    supabase.from('store_settings').select('*').single(),
    isOwner
      ? supabase.from('profiles').select('id, full_name, role, is_active, created_at').order('created_at')
      : Promise.resolve({ data: null }),
  ]);
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader title="Configuración" description="Datos de la tienda, contacto, catálogo y apartados." />
      {!isOwner && (
        <div className="mb-6">
          <FormMessage tone="error">Solo el owner puede modificar la configuración. Puede consultarla.</FormMessage>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <SettingsForm settings={settings} readOnly={!isOwner} />
        {isOwner && users && (
          <Panel title="Usuarios del panel">
            <UsersManager users={users} currentUserId={admin!.id} />
          </Panel>
        )}
      </div>
    </>
  );
}
