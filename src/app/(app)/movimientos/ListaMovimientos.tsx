'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { anularMovimiento, restaurarMovimiento } from '../acciones';
import type { MovimientoHogar, TipoMovimiento, TotalesMes } from '@/lib/datos';
import { formatear } from '@/lib/dinero';
import { etiquetaDia } from '@/lib/fecha';

interface Props {
  householdId: string;
  movimientosDelMes: MovimientoHogar[];
  totales: TotalesMes;
}

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

// «1 movimientos» se lee mal y salta a la vista en cuanto hay un solo apunte.
// Singular y plural se deciden aquí, en un sitio, y no en cada pantalla.
function contarMovimientos(cuantos: number | null): string {
  const n = cuantos ?? 0;
  return n === 1 ? '1 movimiento' : `${n} movimientos`;
}

export function ListaMovimientos({ householdId, movimientosDelMes, totales }: Props) {
  const router = useRouter();
  const filtro = leerFiltro(useSearchParams().get('tipo'));
  // Movimiento cuya anulación/restauración está en curso: evita un doble
  // toque mientras se espera la respuesta de la frontera.
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // La única fuente de cualquier total es este objeto (lección L8): con
  // filtro se lee `expense_total`/`income_total`, sin filtro no se muestra
  // ningún total nuevo. Nunca se suma la lista filtrada a mano.
  const movimientos = filtro ? movimientosDelMes.filter((m) => m.kind === filtro) : movimientosDelMes;
  const grupos = agruparPorDia(movimientos);

  async function cambiarAnulacion(movimiento: MovimientoHogar) {
    setProcesando(movimiento.id);
    setError(null);

    const resultado = movimiento.is_voided
      ? await restaurarMovimiento(householdId, movimiento.id, movimiento.version)
      : await anularMovimiento(householdId, movimiento.id, movimiento.version);

    setProcesando(null);
    if (!resultado.ok) setError(resultado.error.mensaje);

    // Con éxito, refleja el nuevo estado; con conflicto de versión (PT409),
    // «cambió en otro móvil» significa exactamente esto: recargar para ver
    // la versión de verdad en vez de quedarse con la fila desactualizada.
    router.refresh();
  }

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

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-gasto">
          {error}
        </p>
      )}

      {filtro ? (
        <div className="mt-3 rounded-xl border border-borde bg-superficie px-4 py-3">
          <p className="text-sm text-texto-tenue">
            {filtro === 'expense' ? 'Gastos' : 'Ingresos'} de este mes
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-texto">
            {formatear(filtro === 'expense' ? totales.expense_total : totales.income_total)}
          </p>
          <p className="mt-1 text-sm text-texto-tenue">
            {contarMovimientos(filtro === 'expense' ? totales.expense_count : totales.income_count)}
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm text-texto-tenue">
          {contarMovimientos(totales.transaction_count)} este mes
        </p>
      )}

      <div className="mt-4 space-y-6">
        {grupos.map(([dia, delDia]) => (
          <section key={dia}>
            <h2 className="mb-2 text-sm font-medium text-texto-tenue">{etiquetaDia(dia)}</h2>
            <ul className="space-y-2">
              {delDia.map((movimiento) => {
                const anulado = movimiento.is_voided;
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
                    {anulado ? (
                      <div className="mt-2 flex items-center justify-between gap-3 border-t border-borde pt-2">
                        <p className="text-sm text-texto-tenue">Anulado</p>
                        <button
                          type="button"
                          onClick={() => cambiarAnulacion(movimiento)}
                          disabled={procesando === movimiento.id}
                          className="min-h-toque rounded-lg border border-borde px-3 text-sm font-medium text-acento disabled:opacity-40"
                        >
                          Deshacer
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => cambiarAnulacion(movimiento)}
                        disabled={procesando === movimiento.id}
                        className="mt-1 min-h-toque text-sm font-medium text-texto-tenue underline decoration-dotted underline-offset-4 disabled:opacity-40"
                      >
                        Anular
                      </button>
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
