'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { crearHogar } from './acciones';

export function FormularioCrearHogar() {
  const router = useRouter();
  const [nombreHogar, setNombreHogar] = useState('');
  const [nombreMiembro, setNombreMiembro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Una sola clave por intento: si el envío falla y se reintenta, sigue
  // siendo el mismo intento y no puede crear un segundo hogar (BOVEDA/05_RELEVO.md).
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await crearHogar(nombreHogar, nombreMiembro, idempotencyKey);

    if (!resultado.ok) {
      setError(resultado.error.mensaje);
      setEnviando(false);
      return;
    }

    router.refresh();
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
            value={nombreHogar}
            onChange={(evento) => setNombreHogar(evento.target.value)}
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>
        <label className="block text-sm text-texto-tenue">
          Tu nombre
          <input
            type="text"
            required
            autoComplete="name"
            value={nombreMiembro}
            onChange={(evento) => setNombreMiembro(evento.target.value)}
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-medium text-gasto">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 min-h-toque rounded-xl bg-acento text-base font-semibold text-acento-texto disabled:opacity-40"
        >
          Crear hogar
        </button>
      </form>
    </main>
  );
}
