'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/cliente';

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function salir() {
    setSaliendo(true);
    setError(null);

    const supabase = crearClienteNavegador();
    const { error: errorSalida } = await supabase.auth.signOut();

    if (errorSalida) {
      setError('No se ha podido cerrar sesión. Inténtalo de nuevo.');
      setSaliendo(false);
      return;
    }

    router.refresh();
    router.push('/entrar');
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={salir}
        disabled={saliendo}
        className="min-h-toque rounded-lg border border-borde px-3 text-sm font-medium text-texto-tenue disabled:opacity-40"
      >
        Salir
      </button>
      {error && <p role="alert" className="mt-1 text-sm font-medium text-gasto">{error}</p>}
    </div>
  );
}
