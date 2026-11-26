import type { Metadata } from 'next';
import { LoginForm } from './login-form';
import { LogoStacked } from '@/components/brand/logo';

export const metadata: Metadata = {
  title: 'Acceso al panel',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <LogoStacked />
        </div>
        <div className="rounded-lg border border-line bg-white p-6 md:p-8">
          <h1 className="font-display mb-6 text-2xl">Acceso al panel</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
