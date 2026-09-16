'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Pantalla de peaje (mínima, a propósito): no valida nada todavía. La
// comprobación real de la sesión llega con Supabase Auth; por ahora, entrar
// lleva directo a /inicio.
export default function Entrar() {
  const router = useRouter();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    router.push('/inicio');
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-pagina">
      <div>
        <h1 className="text-2xl font-semibold text-texto">Arca</h1>
        <p className="mt-1 text-sm text-texto-tenue">El fondo común del hogar.</p>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label className="block text-sm text-texto-tenue">
          Correo
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>
        <label className="block text-sm text-texto-tenue">
          Contraseña
          <input
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>
        <button
          type="submit"
          className="mt-2 min-h-toque rounded-xl bg-acento text-base font-semibold text-acento-texto"
        >
          Entrar
        </button>
      </form>

      <p className="text-center text-sm text-texto-tenue">
        ¿No tienes hogar todavía?{' '}
        <Link href="/crear-hogar" className="font-medium text-acento">
          Créalo
        </Link>
      </p>
    </main>
  );
}
