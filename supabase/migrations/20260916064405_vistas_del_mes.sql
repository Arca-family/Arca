-- Las vistas de lectura de la fase 1, y con ellas la respuesta a «¿cómo vamos
-- este mes?».
--
-- Esta migración existe por la lección L8: una cifra, una fuente. En la versión
-- anterior, la pantalla de inicio y la de movimientos calculaban lo mismo por
-- separado y no coincidían. Aquí hay una sola cadena de definiciones y las dos
-- pantallas beben de ella:
--
--   transactions  →  household_transactions  →  household_monthly_totals
--
--   · El signo del movimiento se decide **una vez**, en `signed_amount`.
--   · «Anulado» se define **una vez**, en `is_voided`, que no es más que
--     `voided_at is not null`.
--   · El total del mes sale **solo** de `household_monthly_totals`. Ninguna
--     pantalla suma movimientos por su cuenta; si hace falta otra cifra, se
--     añade aquí y la leen las dos.
--
-- Las cuatro identidades de L8 que esto impone por construcción:
--   1. El ingreso del inicio es el mismo que se ve en movimientos: los dos
--      salen de `household_transactions`.
--   2. Las salidas del inicio son los gastos completos del mes (en la fase 1 no
--      hay pagos de deuda todavía; cuando los haya, se suman aquí y en ningún
--      otro sitio).
--   3. El disponible del inicio es `net_total`, que es la suma de los mismos
--      `signed_amount` que ve la lista.
--   4. Las anuladas se excluyen igual en las dos pantallas porque se excluyen
--      con la misma columna.
--
-- Las dos vistas son `security_invoker`: no son un agujero por el que saltarse
-- la RLS, se leen con los permisos de quien pregunta. Un `learner` ve en la
-- lista y en el total exactamente lo mismo: lo suyo.
--
-- Lecciones que protege: L4, L8.

create view public.household_transactions
with (security_invoker = true) as
select
  t.id,
  t.household_id,
  t.kind,
  t.amount,
  case when t.kind = 'expense' then -t.amount else t.amount end as signed_amount,
  t.occurred_on,
  date_trunc('month', t.occurred_on)::date as month,
  t.category_code,
  c.label as category_label,
  t.created_by_member_id,
  m.display_name as author_display_name,
  t.note,
  (t.voided_at is not null) as is_voided,
  t.voided_at,
  t.void_reason,
  t.version,
  t.created_at,
  t.updated_at
from public.transactions t
-- Los dos `left join` son deliberados: si algún día una política dejara de
-- mostrar al autor o una categoría se retirara, el movimiento tiene que seguir
-- estando y seguir contando. Una fila del libro no puede desaparecer de un total
-- por culpa de la visibilidad de otra tabla.
left join public.categories c
  on c.code = t.category_code
 and c.kind = t.kind
left join public.household_members m
  on m.id = t.created_by_member_id
 and m.household_id = t.household_id;

comment on view public.household_transactions is
  'Contrato de lectura de los movimientos: los del hogar, con la etiqueta de la categoría, el nombre del autor, el signo ya puesto y el mes al que pertenecen. Incluye los anulados, marcados con `is_voided`, porque la pantalla de movimientos los enseña para poder deshacerlos.';
comment on column public.household_transactions.signed_amount is
  'El importe con su signo: negativo si es gasto. El signo se decide aquí y en ningún otro sitio, para que la suma de la lista y el total del mes no puedan discrepar (lección L8).';
comment on column public.household_transactions.month is
  'Primer día del mes natural de `occurred_on`. Como `occurred_on` es una fecha del calendario de Madrid, el mes no depende de la zona del dispositivo.';
comment on column public.household_transactions.is_voided is
  'La única definición de «anulado» del proyecto. Lo publicado es `is_voided = false`, y es exactamente la condición que usa la vista de totales.';
comment on column public.household_transactions.author_display_name is
  'Nombre del autor dentro del hogar. Puede ser nulo si su pertenencia no es visible; el movimiento sigue contando igual.';

create view public.household_monthly_totals
with (security_invoker = true) as
select
  t.household_id,
  t.month,
  sum(case when t.kind = 'income' then t.amount else 0 end)::numeric(14,2) as income_total,
  sum(case when t.kind = 'expense' then t.amount else 0 end)::numeric(14,2) as expense_total,
  sum(t.signed_amount)::numeric(14,2) as net_total,
  (count(*) filter (where t.kind = 'income'))::integer as income_count,
  (count(*) filter (where t.kind = 'expense'))::integer as expense_count,
  count(*)::integer as transaction_count
from public.household_transactions t
where not t.is_voided
group by t.household_id, t.month;

comment on view public.household_monthly_totals is
  'La respuesta a «¿cómo vamos este mes?», por hogar y mes natural, contando solo lo publicado. Es la única fuente de esa cifra: si una pantalla necesita un total, lo lee de aquí (lección L8). Para el mes en curso, la consulta rápida es filtrar además por `occurred_on` entre el primer día del mes y el primero del siguiente, que sí usa el índice de `transactions`; filtrar solo por `month` recorre el histórico del hogar.';
comment on column public.household_monthly_totals.income_total is
  'Lo que entró en el mes, en positivo.';
comment on column public.household_monthly_totals.expense_total is
  'Lo que salió en el mes, en positivo. Son los gastos completos; cuando existan los pagos de deuda (fase 4) se sumarán aquí, no en la pantalla.';
comment on column public.household_monthly_totals.net_total is
  'Flujo neto publicado del mes: `income_total - expense_total` por construcción, porque es la suma de los mismos `signed_amount`. Es el «disponible» del inicio, y nunca se mezcla con deuda.';
comment on column public.household_monthly_totals.transaction_count is
  'Cuántos movimientos publicados hay en el mes. Tiene que coincidir con lo que enseña la lista de movimientos filtrada por ese mes: si no coincide, una de las dos pantallas está calculando por su cuenta.';

revoke all on table public.household_transactions from anon, authenticated;
revoke all on table public.household_monthly_totals from anon, authenticated;

grant select on table public.household_transactions to authenticated;
grant select on table public.household_transactions to service_role;
grant select on table public.household_monthly_totals to authenticated;
grant select on table public.household_monthly_totals to service_role;

-- «Este mes» también tiene que ser una sola definición. Calcularlo en el
-- servidor de la aplicación es el camino corto a un error real: a las 00:30 del
-- día 1 en Madrid, un servidor en UTC todavía está en el mes anterior.
create function public.current_month()
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'Europe/Madrid')::date;
$$;

comment on function public.current_month() is
  'Primer día del mes en curso en Madrid, para filtrar `household_monthly_totals`. La zona está escrita aquí igual que en el `check` de `households.time_zone`: si algún día deja de ser fija, los dos sitios cambian a la vez.';

revoke all on function public.current_month() from public, anon;
grant execute on function public.current_month() to authenticated;
grant execute on function public.current_month() to service_role;
