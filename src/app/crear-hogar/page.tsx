'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Pantalla de peaje (mínima, a propósito): no crea ningún hogar todavía. Los
// campos ya llevan el nombre que pedirá `create_household` (nombre del hogar
// y nombre de quien lo crea) para que conectarla después sea rellenar, no
// rediseñar.
export default function CrearHogar() {
  const router = useRouter();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    router.push('/inicio');
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-pagina">
      <div>
        <h1 className="text-2xl font-semibold text-texto">Crear un hogar</h1>
        <p className="mt-1 text-sm text-texto-tenue">
          Con quién compartes el fondo, para empezar a apuntar.
        </p>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label className="block text-sm text-texto-tenue">
          Nombre del hogar
          <input
            type="text"
            required
            placeholder="Casa de..."
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>
        <label className="block text-sm text-texto-tenue">
          Tu nombre
          <input
            type="text"
            required
            autoComplete="name"
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>
        <button
          type="submit"
          className="mt-2 min-h-toque rounded-xl bg-acento text-base font-semibold text-acento-texto"
        >
          Crear hogar
        </button>
      </form>

      <p className="text-center text-sm text-texto-tenue">
        ¿Ya tienes hogar?{' '}
        <Link href="/entrar" className="font-medium text-acento">
          Entra
        </Link>
      </p>
    </main>
  );
}
