'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { obtenerPertenenciaActual } from '@/lib/datos';
import { crearClienteNavegador } from '@/lib/supabase/cliente';
import { traducirErrorAuth } from '@/lib/supabase/errores';

type Modo = 'entrar' | 'registrarse';

// El correo y la contraseña usan el cliente del navegador directamente
// (patrón estándar de @supabase/ssr): no es una escritura de dinero, así que
// no le aplica la regla dura 3 ni pasa por Server Action. Entrar y registrar
// viven en la misma pantalla (el encargo): un simple cambio de modo, sin
// duplicar el formulario.
export function FormularioEntrar() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('entrar');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoConfirmacion, setAvisoConfirmacion] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setAvisoConfirmacion(false);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const { data, error: errorAuth } =
      modo === 'entrar'
        ? await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
        : await supabase.auth.signUp({ email: correo, password: contrasena });

    if (errorAuth) {
      setError(traducirErrorAuth(errorAuth));
      setEnviando(false);
      return;
    }

    if (!data.user || !data.session) {
      // El alta se hizo, pero el proyecto exige confirmar el correo antes de
      // dar sesión: no hay cookie que leer todavía, así que no hay a dónde ir.
      setAvisoConfirmacion(true);
      setEnviando(false);
      return;
    }

    // La sesión ya existe; lo único que puede fallar de aquí en adelante es
    // la lectura de la pertenencia (red, por ejemplo), y eso sí hay que
    // enseñarlo — quedarse con el botón deshabilitado y sin decir nada sería
    // tragarse el fallo.
    try {
      const pertenencia = await obtenerPertenenciaActual(supabase, data.user.id);
      router.refresh();
      router.push(pertenencia ? '/inicio' : '/crear-hogar');
    } catch {
      setError('No se ha podido continuar. Vuelve a intentarlo.');
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-pagina">
      <div>
        <h1 className="text-2xl font-semibold text-texto">Arca</h1>
        <p className="mt-1 text-sm text-texto-tenue">El fondo común del hogar.</p>
      </div>

      <div role="group" aria-label="Modo de acceso" className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setModo('entrar')}
          aria-pressed={modo === 'entrar'}
          className={botonModo(modo === 'entrar')}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setModo('registrarse')}
          aria-pressed={modo === 'registrarse'}
          className={botonModo(modo === 'registrarse')}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label className="block text-sm text-texto-tenue">
          Correo
          <input
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>
        <label className="block text-sm text-texto-tenue">
          Contraseña
          <input
            type="password"
            required
            minLength={6}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            className="mt-1 block min-h-toque w-full rounded-lg border border-borde bg-superficie px-3 text-base text-texto"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-medium text-gasto">
            {error}
          </p>
        )}
        {avisoConfirmacion && (
          <p role="status" className="text-sm text-texto-tenue">
            Te hemos mandado un correo para confirmar la cuenta. Ábrelo y vuelve a entrar.
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 min-h-toque rounded-xl bg-acento text-base font-semibold text-acento-texto disabled:opacity-40"
        >
          {modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  );
}

function botonModo(activo: boolean): string {
  return `min-h-toque rounded-lg border px-3 text-sm font-medium ${
    activo ? 'border-acento bg-acento text-acento-texto' : 'border-borde bg-superficie text-texto-tenue'
  }`;
}
