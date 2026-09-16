'use client';

import { useEffect, useState } from 'react';
import { type Categoria, obtenerCategorias, obtenerPertenenciaActual } from '@/lib/datos';
import { crearClienteNavegador } from '@/lib/supabase/cliente';
import { BarraInferior } from './BarraInferior';
import { EntradaRapida } from './entrada-rapida/EntradaRapida';

/**
 * Envuelve las tres pantallas raíz (inicio, movimientos, estructura) con la
 * barra inferior y la entrada rápida. El estado de «abierta» vive aquí, un
 * nivel por encima de las tres pantallas, porque apuntar un movimiento no
 * cuelga de ninguna de ellas (DEC-0006).
 *
 * También carga aquí, una sola vez por sesión de navegación (este componente
 * no se remonta al cambiar entre las tres pantallas), lo que la entrada
 * rápida necesita para escribir de verdad: el hogar de quien ha entrado y el
 * catálogo de categorías. Cada página ya hace su propia comprobación de
 * sesión y hogar (src/lib/sesion.ts) antes de llegar aquí, así que en la
 * práctica esta carga siempre encuentra los dos datos.
 */
export function NavegacionApp({ children }: { children: React.ReactNode }) {
  const [entradaAbierta, setEntradaAbierta] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    let cancelado = false;

    async function cargar() {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelado || !data.user) {
          if (!cancelado) setCargando(false);
          return;
        }

        const [pertenencia, listaCategorias] = await Promise.all([
          obtenerPertenenciaActual(supabase, data.user.id),
          obtenerCategorias(supabase),
        ]);
        if (cancelado) return;

        setHouseholdId(pertenencia?.householdId ?? null);
        setCategorias(listaCategorias);
        setCargando(false);
      } catch {
        // Visible, no un fallo tragado: sin esto la entrada rápida se
        // quedaría en «Cargando categorías…» para siempre sin decir por qué.
        if (!cancelado) {
          setErrorCarga('No se ha podido cargar tu hogar. Cierra y vuelve a intentarlo.');
          setCargando(false);
        }
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <>
      <div className="pb-barra">{children}</div>
      <BarraInferior onApuntar={() => setEntradaAbierta(true)} />
      {entradaAbierta && (
        <EntradaRapida
          householdId={householdId}
          categorias={categorias}
          cargandoCategorias={cargando}
          errorCarga={errorCarga}
          onCerrar={() => setEntradaAbierta(false)}
        />
      )}
    </>
  );
}
