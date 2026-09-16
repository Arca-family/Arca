'use client';

import { useState } from 'react';
import { type MovimientoHogar, obtenerMovimientosDelMes } from '@/lib/datos-falsos';
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

export default function Movimientos() {
  const grupos = agruparPorDia(obtenerMovimientosDelMes());

  // Solo para poder probar «deshacer» sin Supabase todavía: un id restaurado
  // aquí no persiste entre recargas, y no inventa ningún dato — solo tapa el
  // `is_voided` de un movimiento que ya existe en datos-falsos.ts. Cuando
  // exista `restore_transaction`, esto se sustituye por la llamada real.
  const [restaurados, setRestaurados] = useState<ReadonlySet<string>>(new Set());

  return (
    <main className="mx-auto max-w-md px-pagina pt-8">
      <h1 className="text-xl font-semibold text-texto">Movimientos</h1>

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
