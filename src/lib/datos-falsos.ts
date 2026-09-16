/**
 * Datos falsos de Arca: el hogar, sus miembros, el catálogo de categorías y
 * los movimientos del mes — con la forma exacta de lo que va a devolver
 * Supabase.
 *
 * Es el único módulo que se inventa datos (condición 5 del encargo del
 * esqueleto navegable). Los tipos copian las columnas de
 * `household_transactions` y `household_monthly_totals`
 * (supabase/migrations/20260916064405_vistas_del_mes.sql) con los mismos
 * nombres: cuando llegue Supabase de verdad, este fichero se sustituye por una
 * consulta y ninguna pantalla cambia una sola línea.
 *
 * Una diferencia deliberada con la base: aquí los importes ya son `Centimos`
 * (el entero de src/lib/dinero.ts), no la cadena `numeric` que manda Postgres.
 * Ese paso por `desdeNumericSql` ocurre en el borde real; mientras no exista,
 * este módulo hace de borde.
 *
 * Ninguna pantalla suma movimientos por su cuenta (lección L8): los totales
 * del mes se calculan una sola vez, aquí, con la misma regla que la vista
 * `household_monthly_totals` — solo lo publicado, separado por tipo, y el
 * neto es la suma de los importes ya firmados.
 */

import { type Centimos, sumar } from './dinero';

export type RolMiembro = 'adult' | 'helper' | 'learner';
export type TipoMovimiento = 'income' | 'expense';

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

/** Cómo se llama cada rol en la interfaz. Un solo sitio: nadie más traduce el enum. */
export const ETIQUETA_ROL: Record<RolMiembro, string> = {
  adult: 'Adulto',
  helper: 'Ayuda',
  learner: 'Aprende',
};

export interface Categoria {
  code: string;
  kind: TipoMovimiento;
  label: string;
  sort_order: number;
}

/** Fila de `household_transactions`: un movimiento ya listo para pintar. */
export interface MovimientoHogar {
  id: string;
  household_id: string;
  kind: TipoMovimiento;
  amount: Centimos;
  signed_amount: Centimos;
  occurred_on: string;
  month: string;
  category_code: string;
  category_label: string;
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

const HOGAR: Hogar = { id: 'hogar-1', name: 'Casa de Ana y Bruno' };

const MIEMBROS: MiembroHogar[] = [
  { id: 'miembro-ana', household_id: HOGAR.id, display_name: 'Ana', role: 'adult' },
  { id: 'miembro-bruno', household_id: HOGAR.id, display_name: 'Bruno', role: 'adult' },
  { id: 'miembro-clara', household_id: HOGAR.id, display_name: 'Clara', role: 'helper' },
  { id: 'miembro-dario', household_id: HOGAR.id, display_name: 'Darío', role: 'learner' },
];

// Mismos códigos y etiquetas que
// supabase/migrations/20260916064000_catalogo_de_categorias.sql: una
// categoría elegida ahora sigue significando lo mismo cuando el selector lea
// de Supabase.
const CATEGORIAS: Categoria[] = [
  { code: 'groceries', kind: 'expense', label: 'Compra y supermercado', sort_order: 10 },
  { code: 'home', kind: 'expense', label: 'Vivienda', sort_order: 20 },
  { code: 'utilities', kind: 'expense', label: 'Luz, agua y gas', sort_order: 30 },
  { code: 'telecom', kind: 'expense', label: 'Móvil e internet', sort_order: 40 },
  { code: 'transport', kind: 'expense', label: 'Transporte y coche', sort_order: 50 },
  { code: 'dining_out', kind: 'expense', label: 'Bar y restaurante', sort_order: 60 },
  { code: 'health', kind: 'expense', label: 'Salud y farmacia', sort_order: 70 },
  { code: 'clothing', kind: 'expense', label: 'Ropa y calzado', sort_order: 80 },
  { code: 'leisure', kind: 'expense', label: 'Ocio y viajes', sort_order: 90 },
  { code: 'subscriptions', kind: 'expense', label: 'Suscripciones', sort_order: 100 },
  { code: 'education', kind: 'expense', label: 'Educación', sort_order: 110 },
  { code: 'pets', kind: 'expense', label: 'Mascotas', sort_order: 120 },
  { code: 'gifts', kind: 'expense', label: 'Regalos y celebraciones', sort_order: 130 },
  { code: 'insurance', kind: 'expense', label: 'Seguros', sort_order: 140 },
  { code: 'taxes', kind: 'expense', label: 'Impuestos y tasas', sort_order: 150 },
  { code: 'other_expense', kind: 'expense', label: 'Otros gastos', sort_order: 160 },
  { code: 'salary', kind: 'income', label: 'Nómina', sort_order: 10 },
  { code: 'self_employment', kind: 'income', label: 'Facturación y autónomo', sort_order: 20 },
  { code: 'benefits', kind: 'income', label: 'Ayudas y prestaciones', sort_order: 30 },
  { code: 'refunds', kind: 'income', label: 'Devoluciones y reembolsos', sort_order: 40 },
  { code: 'other_income', kind: 'income', label: 'Otros ingresos', sort_order: 50 },
];

const MES_ACTUAL = '2026-09-01';

function categoria(code: string): Categoria {
  const encontrada = CATEGORIAS.find((c) => c.code === code);
  if (!encontrada) throw new Error(`Categoría falsa desconocida: ${code}`);
  return encontrada;
}

interface DatosMovimientoFalso {
  id: string;
  kind: TipoMovimiento;
  amount: Centimos;
  occurred_on: string;
  category_code: string;
  created_by_member_id: string;
  note?: string;
  is_voided?: boolean;
  void_reason?: string;
}

// Aplica las mismas reglas que la vista `household_transactions`: el signo lo
// pone el tipo, y no hay dos formas de decir «anulado».
function movimiento(datos: DatosMovimientoFalso): MovimientoHogar {
  const cat = categoria(datos.category_code);
  const autor = MIEMBROS.find((m) => m.id === datos.created_by_member_id);
  const anulado = datos.is_voided ?? false;
  return {
    id: datos.id,
    household_id: HOGAR.id,
    kind: datos.kind,
    amount: datos.amount,
    signed_amount: datos.kind === 'expense' ? -datos.amount : datos.amount,
    occurred_on: datos.occurred_on,
    month: MES_ACTUAL,
    category_code: cat.code,
    category_label: cat.label,
    created_by_member_id: datos.created_by_member_id,
    author_display_name: autor?.display_name ?? null,
    note: datos.note ?? null,
    is_voided: anulado,
    voided_at: anulado ? `${datos.occurred_on}T20:00:00+02:00` : null,
    void_reason: anulado ? (datos.void_reason ?? 'Apuntado por error') : null,
    version: 1,
  };
}

// Movimientos del mes en curso (septiembre de 2026): varios días, los dos
// tipos, varios autores, y uno anulado para poder probar «deshacer» en
// /movimientos.
const MOVIMIENTOS: MovimientoHogar[] = [
  movimiento({
    id: 'mov-1',
    kind: 'income',
    amount: 180000,
    occurred_on: '2026-09-01',
    category_code: 'salary',
    created_by_member_id: 'miembro-ana',
    note: 'Nómina de septiembre',
  }),
  movimiento({
    id: 'mov-2',
    kind: 'income',
    amount: 160000,
    occurred_on: '2026-09-01',
    category_code: 'salary',
    created_by_member_id: 'miembro-bruno',
  }),
  movimiento({
    id: 'mov-3',
    kind: 'expense',
    amount: 95000,
    occurred_on: '2026-09-02',
    category_code: 'home',
    created_by_member_id: 'miembro-ana',
    note: 'Alquiler',
  }),
  movimiento({
    id: 'mov-4',
    kind: 'expense',
    amount: 6230,
    occurred_on: '2026-09-04',
    category_code: 'groceries',
    created_by_member_id: 'miembro-bruno',
  }),
  movimiento({
    id: 'mov-5',
    kind: 'expense',
    amount: 1850,
    occurred_on: '2026-09-08',
    category_code: 'dining_out',
    created_by_member_id: 'miembro-clara',
    note: 'Cena con amigas',
  }),
  movimiento({
    id: 'mov-6',
    kind: 'expense',
    amount: 4200,
    occurred_on: '2026-09-08',
    category_code: 'transport',
    created_by_member_id: 'miembro-ana',
    is_voided: true,
    void_reason: 'Se pagó con la tarjeta del trabajo',
  }),
  movimiento({
    id: 'mov-7',
    kind: 'expense',
    amount: 5500,
    occurred_on: '2026-09-12',
    category_code: 'leisure',
    created_by_member_id: 'miembro-dario',
    note: 'Cine',
  }),
  movimiento({
    id: 'mov-8',
    kind: 'expense',
    amount: 3199,
    occurred_on: '2026-09-15',
    category_code: 'subscriptions',
    created_by_member_id: 'miembro-bruno',
  }),
  movimiento({
    id: 'mov-9',
    kind: 'expense',
    amount: 7845,
    occurred_on: '2026-09-16',
    category_code: 'groceries',
    created_by_member_id: 'miembro-ana',
    note: 'Compra grande de la semana',
  }),
  movimiento({
    id: 'mov-10',
    kind: 'income',
    amount: 4000,
    occurred_on: '2026-09-16',
    category_code: 'refunds',
    created_by_member_id: 'miembro-bruno',
    note: 'Devolución de unas zapatillas',
  }),
];

// La misma regla que la vista `household_monthly_totals`: solo lo publicado,
// separado por tipo, y `net_total` es la suma de los importes ya firmados —
// nunca un cálculo distinto del de la lista.
function calcularTotales(movimientos: MovimientoHogar[]): TotalesMes {
  const publicados = movimientos.filter((m) => !m.is_voided);
  const ingresos = publicados.filter((m) => m.kind === 'income');
  const gastos = publicados.filter((m) => m.kind === 'expense');
  return {
    household_id: HOGAR.id,
    month: MES_ACTUAL,
    income_total: sumar(...ingresos.map((m) => m.amount)),
    expense_total: sumar(...gastos.map((m) => m.amount)),
    net_total: sumar(...publicados.map((m) => m.signed_amount)),
    income_count: ingresos.length,
    expense_count: gastos.length,
    transaction_count: publicados.length,
  };
}

const TOTALES_MES: TotalesMes = calcularTotales(MOVIMIENTOS);

/** El hogar de la sesión falsa. */
export function obtenerHogar(): Hogar {
  return HOGAR;
}

/** Los miembros del hogar, en el orden en que se dieron de alta. */
export function obtenerMiembros(): MiembroHogar[] {
  return MIEMBROS;
}

/** El catálogo de categorías, opcionalmente filtrado por tipo y ordenado como en el selector. */
export function obtenerCategorias(tipo?: TipoMovimiento): Categoria[] {
  return CATEGORIAS.filter((c) => !tipo || c.kind === tipo).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
}

/** Los movimientos del mes en curso, del más reciente al más antiguo. */
export function obtenerMovimientosDelMes(): MovimientoHogar[] {
  return [...MOVIMIENTOS].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
}

/** La cifra del mes. Única fuente: ninguna pantalla suma movimientos por su cuenta (lección L8). */
export function obtenerTotalesDelMes(): TotalesMes {
  return TOTALES_MES;
}
