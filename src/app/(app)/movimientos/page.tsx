import { Suspense } from 'react';
import { obtenerMesActual, obtenerMovimientosDelMes, obtenerTotalesDelMes } from '@/lib/datos';
import { exigirHogar, exigirSesion } from '@/lib/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { ListaMovimientos } from './ListaMovimientos';

// El filtro vive en la URL (?tipo=expense|income), no solo en estado de
// React: así se puede compartir, sobrevive a un refresco y el botón de atrás
// del móvil deshace el filtro como se espera. `useSearchParams()` (en
// ListaMovimientos) obliga a un límite de Suspense para que Next pueda
// seguir sirviendo el resto de la pantalla como contenido estático.
export default async function PantallaMovimientos() {
  const supabase = await crearClienteServidor();
  const usuario = await exigirSesion(supabase);
  const pertenencia = await exigirHogar(supabase, usuario.id);

  const mes = await obtenerMesActual(supabase);
  const [movimientos, totales] = await Promise.all([
    obtenerMovimientosDelMes(supabase, pertenencia.householdId, mes),
    obtenerTotalesDelMes(supabase, pertenencia.householdId, mes),
  ]);

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-pagina pt-8">
          <h1 className="text-xl font-semibold text-texto">Movimientos</h1>
        </main>
      }
    >
      <ListaMovimientos
        householdId={pertenencia.householdId}
        movimientosDelMes={movimientos}
        totales={totales}
      />
    </Suspense>
  );
}
