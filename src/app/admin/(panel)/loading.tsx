import { Skeleton } from '@/components/ui/misc';

/** Estado de carga de cada página del panel (también es su límite de Suspense en navegaciones). */
export default function PanelLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
