'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-page flex min-h-[60dvh] flex-col items-center justify-center gap-5 text-center">
      <h1 className="font-display text-4xl">No pudimos cargar esta página</h1>
      <p className="max-w-md text-muted">
        Hubo un problema al obtener la información. Revisa tu conexión e intenta de nuevo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
