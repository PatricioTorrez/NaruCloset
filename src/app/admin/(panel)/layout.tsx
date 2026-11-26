import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { Skeleton } from '@/components/ui/misc';
import { requireAdmin } from '@/lib/auth/admin';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel Naru Closet' },
  robots: { index: false, follow: false },
};

/** Panel privado: verifica sesión y rol en el servidor antes de renderizar (docs/SECURITY.md §2). */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <AuthorizedPanel>{children}</AuthorizedPanel>
    </Suspense>
  );
}

async function AuthorizedPanel({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-col bg-ivory lg:flex-row">
      <AdminNav fullName={admin.fullName} role={admin.role} />
      <main id="contenido" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex min-h-dvh bg-ivory">
      <div className="hidden w-60 border-r border-line bg-white lg:block" />
      <div className="flex-1 p-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    </div>
  );
}
