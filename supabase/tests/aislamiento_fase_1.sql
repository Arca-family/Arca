-- Prueba de aislamiento y de las identidades contables de la fase 1.
--
-- Comprueba con datos reales lo que ninguna lectura del SQL puede confirmar: que
-- un hogar no ve al otro, que el menor en aprendizaje solo ve lo suyo, y que el
-- total del mes coincide con la lista (lección L8).
--
-- **Todo va dentro de una transacción que termina en `rollback`**: no deja ni un
-- usuario ni un movimiento detrás. Se puede lanzar contra el proyecto real.
--
-- Cómo se ejecuta, mientras Docker no esté levantado y no haya pgTAP local:
-- pegarlo entero como una sola consulta (el conector de Supabase, o `psql` con
-- la cadena de conexión del proyecto). Devuelve una fila por comprobación con su
-- veredicto; cualquier `FALLA` es un fallo de verdad.
--
-- Última ejecución: 2026-09-16, 11 de 11 en OK.

begin;

-- Tres cuentas de prueba. Todo esto se deshace con el rollback del final.
insert into auth.users (id) values
  ('aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000003');

create temp table ids (etiqueta text primary key, valor uuid);
create temp table res (n int, prueba text, esperado text, obtenido text);
grant all on ids to authenticated;
grant all on res to authenticated;

-- ===== ANA: adulta, crea el hogar A y apunta un gasto =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

insert into ids select 'hogar_a', (public.create_household('Hogar A', 'Ana', 'clave-hogar-a-01')).id;
insert into ids select 'mov_ana', (public.create_transaction(
  (select valor from ids where etiqueta = 'hogar_a'),
  'expense', 20.00, current_date, 'groceries', 'clave-mov-ana-01', 'compra de Ana')).id;

-- Ana da de alta a Carla como menor en aprendizaje.
insert into public.household_members (household_id, user_id, role, display_name, idempotency_key)
values ((select valor from ids where etiqueta = 'hogar_a'),
        'cccccccc-0000-0000-0000-000000000003', 'learner', 'Carla', 'clave-alta-carla-01');

-- ===== BRUNO: adulto, hogar B aparte =====
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}';
insert into ids select 'hogar_b', (public.create_household('Hogar B', 'Bruno', 'clave-hogar-b-01')).id;
insert into ids select 'mov_bruno', (public.create_transaction(
  (select valor from ids where etiqueta = 'hogar_b'),
  'income', 1500.00, current_date, 'salary', 'clave-mov-bruno-01')).id;

insert into res values
  (1, 'Bruno ve solo su hogar',            '1', (select count(*)::text from public.households)),
  (2, 'Bruno NO ve movimientos del A',     '0', (select count(*)::text from public.transactions where household_id = (select valor from ids where etiqueta = 'hogar_a'))),
  (3, 'Bruno ve el suyo',                  '1', (select count(*)::text from public.transactions));

-- ===== CARLA: learner del hogar A, apunta lo suyo =====
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}';
insert into ids select 'mov_carla', (public.create_transaction(
  (select valor from ids where etiqueta = 'hogar_a'),
  'expense', 5.50, current_date, 'dining_out', 'clave-mov-carla-01')).id;

insert into res values
  (4, 'Carla ve SOLO lo suyo',             '1', (select count(*)::text from public.transactions)),
  (5, 'Carla no ve el rastro del hogar',   '0', (select count(*)::text from public.transaction_void_events)),
  (6, 'Total del mes de Carla = 5,50',     '5.50', coalesce((select expense_total::text from public.household_monthly_totals where month = public.current_month()), 'sin fila'));

-- ===== ANA otra vez: ve todo el hogar A =====
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

insert into res values
  (7,  'Ana ve los dos movimientos',       '2',     (select count(*)::text from public.transactions)),
  (8,  'Gasto del mes del hogar A',        '25.50', (select expense_total::text from public.household_monthly_totals where month = public.current_month())),
  (9,  'Neto del mes del hogar A',         '-25.50',(select net_total::text from public.household_monthly_totals where month = public.current_month())),
  (10, 'La lista cuadra con el total',     '2',     (select transaction_count::text from public.household_monthly_totals where month = public.current_month())),
  (11, 'Ana no puede leer el hogar B',     '0',     (select count(*)::text from public.households where id = (select valor from ids where etiqueta = 'hogar_b')));

select n, prueba, esperado, obtenido,
       case when esperado = obtenido then 'OK' else 'FALLA' end as veredicto
from res order by n;

rollback;
