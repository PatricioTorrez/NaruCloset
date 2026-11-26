import { Logo } from '@/components/brand/logo';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 text-center">
      <Logo className="text-2xl" />
      <h1 className="font-display text-4xl">Esta página no existe</h1>
      <p className="max-w-md text-muted">Puede que el producto ya no esté disponible o que el enlace haya cambiado.</p>
      <ButtonLink href="/catalogo">Ir al catálogo</ButtonLink>
    </main>
  );
}
