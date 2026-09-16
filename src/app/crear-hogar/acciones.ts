'use server';

/** La frontera de escritura para arrancar un hogar (regla dura 3). */
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { traducirErrorFrontera, type ErrorFrontera } from '@/lib/supabase/errores';

export type ResultadoCrearHogar = { ok: true; householdId: string } | { ok: false; error: ErrorFrontera };

export async function crearHogar(
  nombreHogar: string,
  nombreMiembro: string,
  /** Generada por el dispositivo, aleatoria en cada intento (BOVEDA/05_RELEVO.md). */
  idempotencyKey: string,
): Promise<ResultadoCrearHogar> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc('create_household', {
    p_name: nombreHogar,
    p_display_name: nombreMiembro,
    p_idempotency_key: idempotencyKey,
  });

  if (error) return { ok: false, error: traducirErrorFrontera(error) };
  return { ok: true, householdId: data.id };
}
