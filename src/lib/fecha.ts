/**
 * Etiquetas de fecha en español para las pantallas de Arca.
 *
 * Esto no es dinero, por eso vive separado de dinero.ts. Las fechas de negocio
 * son `date` de Postgres (yyyy-mm-dd, sin hora) — igual que `occurred_on` en
 * `transactions` — y aquí se tratan siempre como fecha de calendario, nunca
 * como instante UTC, para no cruzar la frontera del día por la zona horaria
 * del dispositivo.
 */

function aFechaLocal(fechaIso: string): Date {
  // 'yyyy-mm-dd' a secas lo interpreta `Date` como medianoche UTC, que en
  // Madrid puede caer en el día de calendario anterior. Mediodía local evita
  // el salto.
  return new Date(`${fechaIso}T12:00:00`);
}

function mismoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** «Hoy», «Ayer», o «martes, 8 de septiembre» — para agrupar movimientos. */
export function etiquetaDia(fechaIso: string, ahora = new Date()): string {
  const fecha = aFechaLocal(fechaIso);
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);

  if (mismoDia(fecha, ahora)) return 'Hoy';
  if (mismoDia(fecha, ayer)) return 'Ayer';

  const conAno = fecha.getFullYear() !== ahora.getFullYear();
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: conAno ? 'numeric' : undefined,
  }).format(fecha);
}

/** «septiembre de 2026» — para encabezar el mes en curso. */
export function etiquetaMes(mesIso: string): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    aFechaLocal(mesIso),
  );
}

/** yyyy-mm-dd de hoy, según el reloj del dispositivo. Es el valor por omisión
 * de un formulario, no una cifra: «hoy» de verdad lo decide la base con
 * `current_month()` en Europe/Madrid. */
export function hoyIso(ahora = new Date()): string {
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * El primer día del mes siguiente a `mesIso` (yyyy-mm-01). Sirve para acotar
 * `occurred_on` por rango (`>= mes` y `< este valor`) en vez de por igualdad
 * de mes: el rango sí usa el índice de `transactions`
 * (supabase/migrations/20260916064405_vistas_del_mes.sql); filtrar solo por
 * columna de mes recorre el histórico del hogar.
 */
export function primerDiaMesSiguiente(mesIso: string): string {
  const fecha = aFechaLocal(mesIso);
  // El constructor de `Date` hace el acarreo de año él solo con el mes 12.
  const siguiente = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1, 12);
  return `${siguiente.getFullYear()}-${String(siguiente.getMonth() + 1).padStart(2, '0')}-01`;
}
