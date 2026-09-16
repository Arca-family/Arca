/**
 * Lectura real de Arca: hogar, pertenencia, categorías y movimientos, sobre
 * las tablas y vistas de Supabase (supabase/migrations/…). Sustituye a
 * datos-falsos.ts.
 *
 * El cliente autenticado solo lee de aquí. Escribir es cosa de las cuatro
 * funciones de la frontera (regla dura 3, ver src/app/(app)/acciones.ts,
 * src/app/crear-hogar/acciones.ts): este módulo nunca hace `insert` ni
 * `update`.
 *
 * Sirve tanto para el cliente del navegador como para el del servidor: los
 * dos son `SupabaseClient<Database>`, y aquí no importa cuál sea.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { primerDiaMesSiguiente } from './fecha';
import { type Centimos, desdeNumericSql } from './dinero';
import type { Database, Enums, Tables } from '@/types/supabase.generated';

export type ClienteSupabase = SupabaseClient<Database>;

export type TipoMovimiento = Enums<'transaction_kind'>;
export type RolMiembro = Enums<'household_role'>;

/** Cómo se llama cada rol en la interfaz. Un solo sitio: nadie más traduce el enum. */
export const ETIQUETA_ROL: Record<RolMiembro, string> = {
  adult: 'Adulto',
  helper: 'Ayuda',
  learner: 'Aprende',
};

/** El catálogo de categorías es el mismo tipo que genera Supabase: no lleva dinero, no hay frontera que cruzar. */
export type Categoria = Tables<'categories'>;

export interface Hogar {
  id: string;
  name: string;
}

export interface MiembroHogar {
  id: string;
  household_id: string;
  display_name: string;
  role: RolMiembro;
}

/** La pertenencia activa de quien ha iniciado sesión. */
export interface Pertenencia {
  householdId: string;
  memberId: string;
  role: RolMiembro;
  displayName: string;
}

/**
 * Fila de `household_transactions` con el importe ya cruzado al lado de la
 * aplicación: céntimos (src/lib/dinero.ts), nunca el `number` crudo de la
 * vista. El resto son las mismas columnas que genera Supabase, con la
 * nulabilidad estrechada: la vista las marca todas opcionales porque el
 * generador no puede probar lo contrario, pero una fila que existe siempre
 * tiene id, hogar, tipo, importe, fecha, mes, categoría, autor y versión.
 */
export interface MovimientoHogar {
  id: string;
  household_id: string;
  kind: TipoMovimiento;
  amount: Centimos;
  signed_amount: Centimos;
  occurred_on: string;
  month: string;
  category_code: string;
  category_label: string | null;
  created_by_member_id: string;
  author_display_name: string | null;
  note: string | null;
  is_voided: boolean;
  voided_at: string | null;
  void_reason: string | null;
  version: number;
}

/** Fila de `household_monthly_totals`: la respuesta a «¿cómo vamos?». */
export interface TotalesMes {
  household_id: string;
  month: string;
  income_total: Centimos;
  expense_total: Centimos;
  net_total: Centimos;
  income_count: number;
  expense_count: number;
  transaction_count: number;
}

/**
 * El mes en curso según la base (`current_month()`, Europe/Madrid). Nunca se
 * calcula en el dispositivo: a las 00:30 del día 1 en Madrid, un dispositivo
 * en otra zona todavía estaría en el mes anterior.
 */
export async function obtenerMesActual(supabase: ClienteSupabase): Promise<string> {
  const { data, error } = await supabase.rpc('current_month');
  if (error) throw error;
  if (data === null) throw new Error('current_month() no devolvió fecha.');
  return data;
}

/** La pertenencia activa de un usuario, o `null` si todavía no tiene hogar. */
export async function obtenerPertenenciaActual(
  supabase: ClienteSupabase,
  userId: string,
): Promise<Pertenencia | null> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', userId)
    .is('left_at', null)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    householdId: data.household_id,
    memberId: data.id,
    role: data.role,
    displayName: data.display_name,
  };
}

/** El hogar por id. */
export async function obtenerHogar(supabase: ClienteSupabase, householdId: string): Promise<Hogar> {
  const { data, error } = await supabase
    .from('households')
    .select('id, name')
    .eq('id', householdId)
    .single();
  if (error) throw error;
  return data;
}

/** Los miembros activos del hogar, en el orden en que se dieron de alta. */
export async function obtenerMiembros(
  supabase: ClienteSupabase,
  householdId: string,
): Promise<MiembroHogar[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('id, household_id, display_name, role')
    .eq('household_id', householdId)
    .is('left_at', null)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return data;
}

/** El catálogo de categorías, opcionalmente filtrado por tipo y ordenado como en el selector. */
export async function obtenerCategorias(
  supabase: ClienteSupabase,
  tipo?: TipoMovimiento,
): Promise<Categoria[]> {
  let consulta = supabase.from('categories').select('*').eq('is_active', true);
  if (tipo) consulta = consulta.eq('kind', tipo);
  const { data, error } = await consulta.order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

// Una fila de `household_transactions` que existe siempre tiene estas
// columnas rellenas; la vista las marca opcionales porque el generador de
// tipos no puede probarlo. Se comprueba una vez aquí, no en cada pantalla.
function filaAMovimiento(fila: Tables<'household_transactions'>): MovimientoHogar {
  if (
    fila.id === null ||
    fila.household_id === null ||
    fila.kind === null ||
    fila.amount === null ||
    fila.signed_amount === null ||
    fila.occurred_on === null ||
    fila.month === null ||
    fila.category_code === null ||
    fila.created_by_member_id === null ||
    fila.is_voided === null ||
    fila.version === null
  ) {
    throw new Error('Fila de household_transactions incompleta.');
  }

  return {
    id: fila.id,
    household_id: fila.household_id,
    kind: fila.kind,
    amount: desdeNumericSql(fila.amount),
    signed_amount: desdeNumericSql(fila.signed_amount),
    occurred_on: fila.occurred_on,
    month: fila.month,
    category_code: fila.category_code,
    category_label: fila.category_label,
    created_by_member_id: fila.created_by_member_id,
    author_display_name: fila.author_display_name,
    note: fila.note,
    is_voided: fila.is_voided,
    voided_at: fila.voided_at,
    void_reason: fila.void_reason,
    version: fila.version,
  };
}

/**
 * Los movimientos del mes indicado (yyyy-mm-01), del más reciente al más
 * antiguo. Incluye los anulados: la propia vista los enseña para poder
 * deshacerlos. Filtra por rango de `occurred_on`, no por igualdad de `month`
 * (comentario de la vista en
 * supabase/migrations/20260916064405_vistas_del_mes.sql): así se usa el
 * índice de `transactions` en vez de recorrer el histórico del hogar.
 */
export async function obtenerMovimientosDelMes(
  supabase: ClienteSupabase,
  householdId: string,
  mesIso: string,
): Promise<MovimientoHogar[]> {
  const { data, error } = await supabase
    .from('household_transactions')
    .select('*')
    .eq('household_id', householdId)
    .gte('occurred_on', mesIso)
    .lt('occurred_on', primerDiaMesSiguiente(mesIso))
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(filaAMovimiento);
}

function totalesEnCero(householdId: string, mesIso: string): TotalesMes {
  return {
    household_id: householdId,
    month: mesIso,
    income_total: 0,
    expense_total: 0,
    net_total: 0,
    income_count: 0,
    expense_count: 0,
    transaction_count: 0,
  };
}

/** La cifra del mes. Única fuente: ninguna pantalla suma movimientos por su cuenta (lección L8). */
export async function obtenerTotalesDelMes(
  supabase: ClienteSupabase,
  householdId: string,
  mesIso: string,
): Promise<TotalesMes> {
  const { data, error } = await supabase
    .from('household_monthly_totals')
    .select('*')
    .eq('household_id', householdId)
    .eq('month', mesIso)
    .maybeSingle();
  if (error) throw error;

  // Sin movimientos publicados todavía este mes, la vista no tiene fila para
  // ese mes: no es una cifra que se calcule aquí, es el cero que representa
  // «nada publicado» — el mismo significado que le daría la vista si pudiera
  // devolver una fila vacía.
  if (!data) return totalesEnCero(householdId, mesIso);

  return {
    household_id: data.household_id ?? householdId,
    month: data.month ?? mesIso,
    income_total: desdeNumericSql(data.income_total ?? 0),
    expense_total: desdeNumericSql(data.expense_total ?? 0),
    net_total: desdeNumericSql(data.net_total ?? 0),
    income_count: data.income_count ?? 0,
    expense_count: data.expense_count ?? 0,
    transaction_count: data.transaction_count ?? 0,
  };
}
