'use server';

/**
 * Las tres funciones de la frontera que tocan movimientos (regla dura 3):
 * apuntar, anular y restaurar. El cliente nunca escribe en `transactions`
 * directamente — no tiene privilegio para hacerlo, y es a propósito.
 */
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { traducirErrorFrontera, type ErrorFrontera } from '@/lib/supabase/errores';
import { aNumericoRpc, type Centimos } from '@/lib/dinero';
import type { TipoMovimiento } from '@/lib/datos';

export type ResultadoAccion<T> = { ok: true; datos: T } | { ok: false; error: ErrorFrontera };

export interface DatosNuevoMovimiento {
  householdId: string;
  kind: TipoMovimiento;
  amount: Centimos;
  occurredOn: string;
  categoryCode: string;
  note: string | null;
  /** Generada por el dispositivo, aleatoria en cada intento (BOVEDA/05_RELEVO.md): nunca se deriva de estos mismos datos. */
  idempotencyKey: string;
}

export async function apuntarMovimiento(
  datos: DatosNuevoMovimiento,
): Promise<ResultadoAccion<{ id: string; version: number }>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc('create_transaction', {
    p_household_id: datos.householdId,
    p_kind: datos.kind,
    p_amount: aNumericoRpc(datos.amount),
    p_occurred_on: datos.occurredOn,
    p_category_code: datos.categoryCode,
    p_idempotency_key: datos.idempotencyKey,
    p_note: datos.note ?? undefined,
  });

  if (error) return { ok: false, error: traducirErrorFrontera(error) };
  return { ok: true, datos: { id: data.id, version: data.version } };
}

export async function anularMovimiento(
  householdId: string,
  transactionId: string,
  expectedVersion: number,
): Promise<ResultadoAccion<{ version: number }>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc('void_transaction', {
    p_household_id: householdId,
    p_transaction_id: transactionId,
    p_expected_version: expectedVersion,
  });

  if (error) return { ok: false, error: traducirErrorFrontera(error) };
  return { ok: true, datos: { version: data.version } };
}

export async function restaurarMovimiento(
  householdId: string,
  transactionId: string,
  expectedVersion: number,
): Promise<ResultadoAccion<{ version: number }>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc('restore_transaction', {
    p_household_id: householdId,
    p_transaction_id: transactionId,
    p_expected_version: expectedVersion,
  });

  if (error) return { ok: false, error: traducirErrorFrontera(error) };
  return { ok: true, datos: { version: data.version } };
}
