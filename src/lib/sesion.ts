/**
 * Reglas de acceso de Arca: sin sesión, a /entrar; con sesión pero sin hogar,
 * a /crear-hogar. Un solo sitio para las dos comprobaciones — las usan
 * /inicio, /movimientos y /estructura por igual — para que ninguna pantalla
 * pueda aplicar la regla de forma distinta (lección L6: los destinos de
 * redirección son una lista propia, no algo que decida cada pantalla).
 */
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { type ClienteSupabase, type Pertenencia, obtenerPertenenciaActual } from './datos';

/** Exige sesión activa; si no la hay, manda a /entrar. */
export async function exigirSesion(supabase: ClienteSupabase): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/entrar');
  return data.user;
}

/** Exige que la persona ya tenga hogar; si no, manda a /crear-hogar. */
export async function exigirHogar(supabase: ClienteSupabase, userId: string): Promise<Pertenencia> {
  const pertenencia = await obtenerPertenenciaActual(supabase, userId);
  if (!pertenencia) redirect('/crear-hogar');
  return pertenencia;
}
