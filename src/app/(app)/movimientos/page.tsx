'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import {
  type MovimientoHogar,
  type TipoMovimiento,
  obtenerMovimientosDelMes,
  obtenerTotalesDelMes,
} from '@/lib/datos-falsos';
import { formatear } from '@/lib/dinero';
import { etiquetaDia } from '@/lib/fecha';

function agruparPorDia(movimientos: MovimientoHogar[]): [string, MovimientoHogar[]][] {
  const grupos = new Map<string, MovimientoHogar[]>();
  for (const movimiento of movimientos) {
    const lista = grupos.get(movimiento.occurred_on) ?? [];
    lista.push(movimiento);
    grupos.set(movimiento.occurred_on, lista);
  }
  return [...grupos.entries()];
}

// Cualquier valor que no sea uno de los dos tipos se trata como «sin
// filtro»: una URL vieja o mal escrita enseña todos los movimientos en vez de
// romper la pantalla.
function leerFiltro(valor: string | null): TipoMovimiento | null {
  return valor === 'expense' || valor === 'income' ? valor : null;
}

// El filtro vive en la URL (?tipo=expense|income), no solo en estado de
// React: así se puede compartir, sobrevive a un refresco y el botón de atrás
// del móvil deshace el filtro como se espera. `useSearchParams()` obliga a un
// límite de Suspense para que Next pueda seguir sirviendo el resto de la
// pantalla como contenido estático.
export default function PantallaMovimientos() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-pagina pt-8">
          <h1 className="text-xl font-semibold text-texto">Movimientos</h1>
        </main>
      }
    >
      <Movimientos />
    </Suspense>
  );
}

function Movimientos() {
  const filtro = leerFiltro(useSearchParams().get('tipo'));
  // La única fuente de cualquier total es este objeto (lección L8): con
  // filtro se lee `expense_total`/`income_total`, sin filtro no se muestra
  // ningún total nuevo. Nunca se suma la lista filtrada a mano.
  const totales = obtenerTotalesDelMes();
  const todos = obtenerMovimientosDelMes();
  const movimientos = filtro ? todos.filter((m) => m.kind === filtro) : todos;
  const grupos = agruparPorDia(movimientos);

  // Solo para poder probar «deshacer» sin Supabase todavía: un id restaurado
  // aquí no persiste entre recargas, y no inventa ningún dato — solo tapa el
  // `is_voided` de un movimiento que ya existe en datos-falsos.ts. Cuando
  // exista `restore_transaction`, esto se sustituye por la llamada real.
  const [restaurados, setRestaurados] = useState<ReadonlySet<string>>(new Set());

  return (
    <main className="mx-auto max-w-md px-pagina pt-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-texto">Movimientos</h1>
        {filtro && (
          <Link
            href="/movimientos"
            className="flex min-h-toque items-center rounded-lg px-2 text-sm font-medium text-acento"
          >
            Ver todos
          </Link>
        )}
      </div>

      {filtro ? (
        <div className="mt-3 rounded-xl border border-borde bg-superficie px-4 py-3">
          <p className="text-sm text-texto-tenue">
            {filtro === 'expense' ? 'Gastos' : 'Ingresos'} de este mes
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-texto">
            {formatear(filtro === 'expense' ? totales.expense_total : totales.income_total)}
          </p>
          <p className="mt-1 text-sm text-texto-tenue">
            {filtro === 'expense' ? totales.expense_count : totales.income_count} movimientos
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm text-texto-tenue">
          {totales.transaction_count} movimientos este mes
        </p>
      )}

      <div className="mt-4 space-y-6">
        {grupos.map(([dia, delDia]) => (
          <section key={dia}>
            <h2 className="mb-2 text-sm font-medium text-texto-tenue">{etiquetaDia(dia)}</h2>
            <ul className="space-y-2">
              {delDia.map((movimiento) => {
                const anulado = movimiento.is_voided && !restaurados.has(movimiento.id);
                const secundaria = [movimiento.author_display_name, movimiento.note]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li
                    key={movimiento.id}
                    className="rounded-xl border border-borde bg-superficie px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium text-texto">
                          {movimiento.category_label}
                        </p>
                        {secundaria !== '' && (
                          <p className="truncate text-sm text-texto-tenue">{secundaria}</p>
                        )}
                      </div>
                      {/* El signo ya distingue gasto de ingreso sin depender
                          solo del color; el tachado hace lo mismo con lo
                          anulado. */}
                      <p
                        className={`shrink-0 text-right text-base font-semibold tabular-nums ${
                          anulado
                            ? 'text-texto-tenue line-through'
                            : movimiento.kind === 'expense'
                              ? 'text-gasto'
                              : 'text-ingreso'
                        }`}
                      >
                        {formatear(movimiento.signed_amount)}
                      </p>
                    </div>
                    {anulado && (
                      <div className="mt-2 flex items-center justify-between gap-3 border-t border-borde pt-2">
                        <p className="text-sm text-texto-tenue">Anulado</p>
                        <button
                          type="button"
                          onClick={() =>
                            setRestaurados((anteriores) => new Set(anteriores).add(movimiento.id))
                          }
                          className="min-h-toque rounded-lg border border-borde px-3 text-sm font-medium text-acento"
                        >
                          Deshacer
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
