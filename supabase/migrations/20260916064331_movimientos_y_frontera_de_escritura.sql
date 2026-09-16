-- El movimiento: ingreso o gasto. El corazón de la fase 1.
--
-- Qué hace:
--   1. `public.transactions` — importe, fecha, categoría, autor, nota opcional y
--      estado de anulación. Nada más: ni cuentas, ni traspasos, ni presupuestos,
--      ni deudas. Eso es fase 2, 3 y 4, y la lección L0 dice que el alcance mata
--      antes que los bugs.
--   2. `public.transaction_void_events` — el rastro. La anulación es reversible,
--      así que el motivo de una anulación deshecha no puede vivir solo en la
--      fila: cada anulación y cada reversión se apunta aquí, y esto no se edita
--      ni se borra desde ningún sitio.
--   3. La frontera de escritura: `create_transaction`, `void_transaction` y
--      `restore_transaction`. El cliente autenticado **solo tiene `select`** en
--      estas dos tablas; el dinero entra por función (lección L5).
--
-- Por qué el modelo es así:
--   · `amount numeric(14,2)` y siempre positivo: el signo lo pone `kind`. No
--     existe «un ingreso de -20 €», y ninguna suma pasa por coma flotante.
--   · `occurred_on` es `date`, no `timestamptz`: un gasto pertenece a un día del
--     calendario de Madrid. Con un instante, el mismo gasto podría caer en dos
--     meses distintos según el móvil que lo mire, y la cifra del mes dejaría de
--     ser una sola.
--   · Un movimiento **no se borra nunca**: se anula. Por eso no hay privilegio ni
--     política de `delete` para nadie de la API.
--   · Claves foráneas compuestas a `household_members (id, household_id)` para el
--     autor y para quien anula: la base hace imposible que un movimiento lo firme
--     alguien de otro hogar (lección L12). Y a `categories (code, kind)`, que
--     hace imposible apuntar un gasto en una categoría de ingreso.
--
-- Códigos de error de la frontera (convención del proyecto, decidida aquí y no
-- por función, para no acabar con cuatro apellidos por función — lección L14):
--   · 42501 no autorizado           → PostgREST responde 403
--   · P0002 no existe en este hogar → 404
--   · 22023 parámetro inválido      → 400
--   · PT409 conflicto de versión    → 409 (prefijo PT + estado HTTP)
--
-- Convención de evolución de estas funciones: los parámetros nuevos se añaden al
-- final con valor por omisión; si hay que cambiar la forma, se reemplaza la
-- función en su sitio con otra migración. Nunca un sufijo `_v2`.
--
-- Lecciones que protege: L0, L1, L3, L4, L5, L8, L11, L12, L14.

-- ---------------------------------------------------------------------------
-- 1. El movimiento
-- ---------------------------------------------------------------------------

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  kind public.transaction_kind not null,
  amount numeric(14,2) not null
    constraint transactions_amount_positive check (amount > 0),
  occurred_on date not null
    constraint transactions_occurred_on_range check (occurred_on >= date '2000-01-01' and occurred_on < date '2100-01-01'),
  category_code text not null,
  note text
    constraint transactions_note_shape check (note is null or (btrim(note) <> '' and char_length(note) <= 280)),
  created_by_member_id uuid not null,
  voided_at timestamptz,
  voided_by_member_id uuid,
  void_reason text
    constraint transactions_void_reason_shape check (void_reason is null or (btrim(void_reason) <> '' and char_length(void_reason) <= 280)),
  version integer not null default 1
    constraint transactions_version_positive check (version > 0),
  idempotency_key text not null
    constraint transactions_idempotency_key_shape check (char_length(idempotency_key) between 8 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_household_fk foreign key (household_id)
    references public.households (id) on delete restrict,
  -- `restrict` en los dos lados a propósito: con `on update cascade`, cambiar el
  -- `kind` de una categoría del catálogo convertiría gastos en ingresos sin que
  -- nadie lo pidiera. La identidad de una categoría no cambia; si hay que
  -- retirarla, se marca `is_active = false`.
  constraint transactions_category_fk foreign key (category_code, kind)
    references public.categories (code, kind) on update restrict on delete restrict,
  constraint transactions_author_fk foreign key (created_by_member_id, household_id)
    references public.household_members (id, household_id) on delete restrict,
  constraint transactions_voided_by_fk foreign key (voided_by_member_id, household_id)
    references public.household_members (id, household_id) on delete restrict,
  constraint transactions_void_coherent check (
    (voided_at is null and voided_by_member_id is null and void_reason is null)
    or (voided_at is not null and voided_by_member_id is not null)
  ),
  constraint transactions_id_household_unique unique (id, household_id),
  constraint transactions_idempotency_unique unique (household_id, idempotency_key)
);

comment on table public.transactions is
  'Un movimiento del hogar: entra dinero o sale. Es el libro de la fase 1 y la única fuente de las cifras del mes. El cliente autenticado solo lo lee; se escribe por las funciones de la frontera.';
comment on column public.transactions.kind is
  'Ingreso o gasto. Es el signo del movimiento y forma parte de la clave foránea a `categories`, para que la categoría y el tipo no se puedan contradecir.';
comment on column public.transactions.amount is
  'Importe en euros, `numeric(14,2)` y siempre positivo (regla dura número uno). El signo lo pone `kind`; guardarlo con signo permitiría un ingreso negativo, que no significa nada.';
comment on column public.transactions.occurred_on is
  'Día en el que se movió el dinero, en el calendario de Madrid. Es `date` a propósito: es lo que decide a qué mes pertenece y no puede depender de la zona del dispositivo. Los límites del `check` cazan el año mal teclado, que si no dejaría el movimiento invisible en todos los meses.';
comment on column public.transactions.category_code is
  'Categoría del catálogo global. Obligatoria: sin ella la pregunta «en qué se va el mes» no se puede responder, y el selector siempre ofrece «Otros gastos» u «Otros ingresos».';
comment on column public.transactions.note is
  'Nota opcional de quien apunta. Texto libre; si viene en blanco se guarda nulo, para que no haya dos formas de decir «sin nota».';
comment on column public.transactions.created_by_member_id is
  'Miembro que lo apuntó. Con `household_id` forma la clave foránea compuesta contra `household_members (id, household_id)`: la base hace imposible que el autor sea de otro hogar (lección L12).';
comment on column public.transactions.voided_at is
  'Mientras sea nulo, el movimiento está publicado y cuenta en las cifras del mes. Esta columna es la **única** definición de «anulado» del proyecto (lección L8).';
comment on column public.transactions.voided_by_member_id is
  'Quién anuló. Obligatorio si hay anulación, por el `check` de coherencia: una anulación sin autor no es rastro auditable.';
comment on column public.transactions.void_reason is
  'Motivo de la anulación **vigente**. El histórico completo, incluido el de anulaciones ya deshechas, está en `transaction_void_events`.';
comment on column public.transactions.version is
  'Bloqueo optimista. Lo sube el disparador en cada `update`; la frontera de escritura exige la versión que leyó el móvil y falla con PT409 si otro llegó antes (lección L11).';
comment on column public.transactions.idempotency_key is
  'Clave del formulario de alta. Con `unique (household_id, idempotency_key)`, reenviar el alta devuelve el movimiento que ya existe en vez de duplicar el gasto (lección L11).';

-- La lista de movimientos del hogar por fecha, y la vista de totales del mes.
-- No es parcial a propósito: la pantalla de movimientos también muestra las
-- anuladas, marcadas, para poder deshacerlas.
create index transactions_household_occurred_idx
  on public.transactions (household_id, occurred_on desc, created_at desc);

-- «Lo mío»: es la condición de la política del menor en aprendizaje y el camino
-- que recorre la clave foránea del autor cuando se comprueba un `restrict`.
create index transactions_household_author_idx
  on public.transactions (household_id, created_by_member_id);

create trigger transactions_stamp_update
  before update on public.transactions
  for each row execute function private.stamp_update();

-- ---------------------------------------------------------------------------
-- 2. El rastro de las anulaciones
-- ---------------------------------------------------------------------------

create table public.transaction_void_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  transaction_id uuid not null,
  action public.transaction_void_action not null,
  reason text
    constraint transaction_void_events_reason_shape check (reason is null or (btrim(reason) <> '' and char_length(reason) <= 280)),
  member_id uuid not null,
  created_at timestamptz not null default now(),
  constraint transaction_void_events_household_fk foreign key (household_id)
    references public.households (id) on delete restrict,
  constraint transaction_void_events_transaction_fk foreign key (transaction_id, household_id)
    references public.transactions (id, household_id) on delete restrict,
  constraint transaction_void_events_member_fk foreign key (member_id, household_id)
    references public.household_members (id, household_id) on delete restrict
);

comment on table public.transaction_void_events is
  'Registro de solo añadir: cada anulación y cada reversión de un movimiento, con quién y cuándo. Existe porque la anulación es reversible: al deshacerla se limpia el estado de la fila y el motivo solo sobrevive aquí. Ningún rol de la API tiene `update` ni `delete` sobre esta tabla, `service_role` incluido; tampoco las funciones de la frontera, que solo insertan. Corregir el rastro exige una migración, que se ejecuta como dueño y queda en el historial.';
comment on column public.transaction_void_events.transaction_id is
  'Movimiento afectado. Clave foránea compuesta con `household_id` contra `transactions (id, household_id)`: un evento no puede señalar a un movimiento de otro hogar (lección L12).';
comment on column public.transaction_void_events.action is
  'Si se anuló o si se deshizo la anulación.';
comment on column public.transaction_void_events.reason is
  'Lo que escribió la persona, tanto al anular como al deshacerlo. Es la única copia duradera del motivo.';
comment on column public.transaction_void_events.member_id is
  'Miembro que hizo la operación.';

-- El histórico de un movimiento, del más reciente al más antiguo.
create index transaction_void_events_transaction_idx
  on public.transaction_void_events (household_id, transaction_id, created_at desc);

-- No lleva `idempotency_key`: la idempotencia la da el estado del movimiento. Si
-- ya está anulado, la frontera devuelve la fila sin escribir otro evento, así que
-- un doble toque no puede dejar dos anulaciones apuntadas.

-- ---------------------------------------------------------------------------
-- 3. Privilegios y RLS
-- ---------------------------------------------------------------------------

alter table public.transactions enable row level security;
alter table public.transaction_void_events enable row level security;

revoke all on table public.transactions from anon, authenticated;
revoke all on table public.transaction_void_events from anon, authenticated;

grant select on table public.transactions to authenticated;
-- `service_role` tampoco tiene `delete`. La regla «un movimiento no se borra
-- nunca» tiene que ser verdad también para la llave del servidor, o el comentario
-- de la tabla es mentira y alguien se fiará de él. Si algún día hay que borrar de
-- verdad, será una migración: se ejecuta como dueño y deja fichero y revisión.
grant select, insert, update on table public.transactions to service_role;

grant select on table public.transaction_void_events to authenticated;
-- El rastro es de solo añadir para todos los roles de la API, `service_role`
-- incluido: se puede apuntar, no corregir ni borrar.
grant select, insert on table public.transaction_void_events to service_role;

create policy transactions_select_own on public.transactions
  for select to authenticated
  using (
    private.can_read_all_transactions(household_id)
    or created_by_member_id = private.current_household_member_id(household_id)
  );

-- Aquí no hay política de `insert`, de `update` ni de `delete`, y es a propósito.
--
-- Hubo una primera versión de esta migración con políticas de escritura «listas
-- por si acaso», comentadas como correctas. No lo eran: una política de fila
-- puede comprobar de quién es el movimiento, pero no puede exigir que el importe
-- traiga dos decimales, ni que la categoría siga activa, ni escribir el evento de
-- anulación. Un `grant insert` hecho al leer ese comentario habría abierto un
-- camino de escritura más flojo que la frontera, y con el mismo aspecto de estar
-- bendecido. Se quitaron.
--
-- Escribir en el libro es `public.create_transaction`, `public.void_transaction` y
-- `public.restore_transaction`, y nada más (lección L5). Quien necesite un camino
-- de escritura nuevo escribe otra función en la frontera; conceder el privilegio
-- directo sobre la tabla no es una alternativa que esté sobre la mesa, ni con
-- política ni sin ella.
--
-- Y un movimiento no se borra nunca: se anula, para no perder el rastro.

-- El histórico completo lo leen el adulto y el hijo que ayuda. El menor en
-- aprendizaje no ve el registro de auditoría del hogar, pero sí el estado de
-- anulación de sus propios movimientos, que va en la fila.
create policy transaction_void_events_select_own on public.transaction_void_events
  for select to authenticated
  using (private.can_read_all_transactions(household_id));

-- ---------------------------------------------------------------------------
-- 4. Frontera de escritura: apuntar
-- ---------------------------------------------------------------------------

-- Buscar por `idempotency_key` corre como `definer`, así que aquí no se aplica
-- `transactions_select_own`: el alcance de lectura hay que reaplicarlo a mano
-- (lección L1). Si no, un `learner` que mandara una clave ya usada por otro
-- miembro recibiría el movimiento entero de ese otro —importe, nota, categoría y
-- autor— a cambio de acertar una cadena. La regla es: esta función nunca
-- devuelve una fila que quien pregunta no podría leer.
create function private.transaction_by_idempotency_key(
  p_household_id uuid,
  p_idempotency_key text,
  p_member_id uuid
)
returns setof public.transactions
language plpgsql
-- Volátil a propósito, no `stable`: se la llama también desde el manejador de
-- `unique_violation`, cuando el otro móvil acaba de confirmar su fila. Una
-- función `stable` se quedaría con la instantánea de quien llamó, no vería esa
-- fila recién confirmada y devolvería un error de clave duplicada en vez del
-- movimiento que ya existe, que es justo lo que la idempotencia tiene que evitar.
security definer
set search_path = ''
as $$
declare
  v_row public.transactions;
begin
  select * into v_row
  from public.transactions
  where household_id = p_household_id
    and idempotency_key = p_idempotency_key;

  if not found then
    return;
  end if;

  if not private.can_read_all_transactions(p_household_id)
     and v_row.created_by_member_id is distinct from p_member_id then
    -- Ni la fila ni de quién es: solo que esa clave ya no sirve.
    raise exception 'Esa clave de idempotencia ya está en uso en este hogar. Genera una nueva.'
      using errcode = 'PT409';
  end if;

  return next v_row;
end;
$$;

comment on function private.transaction_by_idempotency_key(uuid, text, uuid) is
  'Devuelve el movimiento que ya se apuntó con esa clave, pero solo si quien pregunta tiene alcance para verlo. Es lo que hace que reenviar un formulario sea idempotente sin convertirse en una rendija para leer lo de otro miembro.';

create function private.create_transaction(
  p_household_id uuid,
  p_kind public.transaction_kind,
  p_amount numeric,
  p_occurred_on date,
  p_category_code text,
  p_idempotency_key text,
  p_note text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_row public.transactions;
begin
  -- Primera línea útil: autorización a mano. Esta función es `definer` y aquí la
  -- RLS no se aplica (lección L1).
  v_member_id := private.current_household_member_id(p_household_id);
  if v_member_id is null then
    raise exception 'No perteneces a este hogar.'
      using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'El importe tiene que ser mayor que cero.'
      using errcode = '22023';
  end if;

  -- Sin esto, `numeric(14,2)` redondearía en silencio un tercer decimal. Un
  -- importe redondeado a espaldas de quien lo escribe es peor que un error.
  if p_amount <> round(p_amount, 2) then
    raise exception 'El importe % tiene más de dos decimales; Arca no redondea dinero por su cuenta.', p_amount
      using errcode = '22023';
  end if;

  if p_occurred_on is null then
    raise exception 'Falta la fecha del movimiento.'
      using errcode = '22023';
  end if;

  -- La clave foránea compuesta ya impide cruzar tipo y categoría; esto añade lo
  -- que la clave no sabe (que la categoría siga en uso) y da un mensaje claro.
  if not exists (
    select 1
    from public.categories c
    where c.code = p_category_code
      and c.kind = p_kind
      and c.is_active
  ) then
    raise exception 'La categoría % no existe para un movimiento de tipo %, o está retirada del catálogo.', p_category_code, p_kind
      using errcode = '22023';
  end if;

  -- Reenviar el formulario devuelve el movimiento que ya existe (lección L11), y
  -- solo si quien pregunta podría verlo: de eso se encarga la función de arriba.
  select * into v_row
  from private.transaction_by_idempotency_key(p_household_id, p_idempotency_key, v_member_id);
  if found then
    return v_row;
  end if;

  insert into public.transactions (
    household_id, kind, amount, occurred_on, category_code, note,
    created_by_member_id, idempotency_key
  )
  values (
    p_household_id, p_kind, p_amount, p_occurred_on, p_category_code,
    nullif(btrim(p_note), ''), v_member_id, p_idempotency_key
  )
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    -- Dos envíos a la vez: gana el primero y el segundo devuelve esa misma fila,
    -- con el mismo filtro de alcance. Si la clave era de otro miembro, de aquí
    -- sale el conflicto, no sus datos.
    select * into v_row
    from private.transaction_by_idempotency_key(p_household_id, p_idempotency_key, v_member_id);
    if found then
      return v_row;
    end if;
    raise;
end;
$$;

comment on function private.create_transaction(uuid, public.transaction_kind, numeric, date, text, text, text) is
  'Implementación de «apuntar un movimiento»: comprueba la pertenencia a mano, valida el importe y la categoría, y es idempotente por `idempotency_key`.';

create function public.create_transaction(
  p_household_id uuid,
  p_kind public.transaction_kind,
  p_amount numeric,
  p_occurred_on date,
  p_category_code text,
  p_idempotency_key text,
  p_note text default null
)
returns public.transactions
language sql
security definer
set search_path = ''
as $$
  select * from private.create_transaction(
    p_household_id, p_kind, p_amount, p_occurred_on, p_category_code,
    p_idempotency_key, p_note
  );
$$;

comment on function public.create_transaction(uuid, public.transaction_kind, numeric, date, text, text, text) is
  'Frontera de escritura para apuntar un ingreso o un gasto. Es el único camino del cliente para escribir en el libro (lección L5). El importe viaja como cadena con dos decimales desde src/lib/dinero.ts.';

-- ---------------------------------------------------------------------------
-- 5. Frontera de escritura: anular y deshacer la anulación
-- ---------------------------------------------------------------------------

create function private.void_transaction(
  p_household_id uuid,
  p_transaction_id uuid,
  p_expected_version integer,
  p_reason text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_row public.transactions;
begin
  v_member_id := private.current_household_member_id(p_household_id);
  if v_member_id is null then
    raise exception 'No perteneces a este hogar.'
      using errcode = '42501';
  end if;

  select * into v_row
  from public.transactions
  where id = p_transaction_id
    and household_id = p_household_id
  for update;

  if not found then
    raise exception 'El movimiento no existe en este hogar.'
      using errcode = 'P0002';
  end if;

  -- El alcance para anular es el mismo que para leer: quien solo ve lo suyo,
  -- solo anula lo suyo.
  if not private.can_read_all_transactions(p_household_id)
     and v_row.created_by_member_id is distinct from v_member_id then
    raise exception 'Solo puedes anular movimientos que hayas apuntado tú.'
      using errcode = '42501';
  end if;

  -- Ya estaba anulado: se devuelve tal cual, sin subir versión ni apuntar un
  -- segundo evento. Un doble toque no es un hecho nuevo.
  if v_row.voided_at is not null then
    return v_row;
  end if;

  if v_row.version <> p_expected_version then
    raise exception 'El movimiento cambió en otro dispositivo (versión % frente a la %). Vuelve a cargarlo.', v_row.version, p_expected_version
      using errcode = 'PT409';
  end if;

  update public.transactions
     set voided_at = now(),
         voided_by_member_id = v_member_id,
         void_reason = nullif(btrim(p_reason), '')
   where id = v_row.id
     and household_id = p_household_id
  returning * into v_row;

  insert into public.transaction_void_events (household_id, transaction_id, action, reason, member_id)
  values (p_household_id, v_row.id, 'void', v_row.void_reason, v_member_id);

  return v_row;
end;
$$;

comment on function private.void_transaction(uuid, uuid, integer, text) is
  'Implementación de la anulación: autorización a mano, bloqueo optimista por `version`, estado en la fila y rastro en `transaction_void_events`. Anular dos veces no cambia nada.';

create function private.restore_transaction(
  p_household_id uuid,
  p_transaction_id uuid,
  p_expected_version integer,
  p_reason text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_row public.transactions;
begin
  v_member_id := private.current_household_member_id(p_household_id);
  if v_member_id is null then
    raise exception 'No perteneces a este hogar.'
      using errcode = '42501';
  end if;

  select * into v_row
  from public.transactions
  where id = p_transaction_id
    and household_id = p_household_id
  for update;

  if not found then
    raise exception 'El movimiento no existe en este hogar.'
      using errcode = 'P0002';
  end if;

  if not private.can_read_all_transactions(p_household_id)
     and v_row.created_by_member_id is distinct from v_member_id then
    raise exception 'Solo puedes recuperar movimientos que hayas apuntado tú.'
      using errcode = '42501';
  end if;

  -- No estaba anulado: nada que deshacer.
  if v_row.voided_at is null then
    return v_row;
  end if;

  if v_row.version <> p_expected_version then
    raise exception 'El movimiento cambió en otro dispositivo (versión % frente a la %). Vuelve a cargarlo.', v_row.version, p_expected_version
      using errcode = 'PT409';
  end if;

  -- Se limpia el estado de anulación de la fila. El motivo con el que se anuló ya
  -- está a salvo en el registro de eventos: por eso ese registro existe.
  update public.transactions
     set voided_at = null,
         voided_by_member_id = null,
         void_reason = null
   where id = v_row.id
     and household_id = p_household_id
  returning * into v_row;

  insert into public.transaction_void_events (household_id, transaction_id, action, reason, member_id)
  values (p_household_id, v_row.id, 'restore', nullif(btrim(p_reason), ''), v_member_id);

  return v_row;
end;
$$;

comment on function private.restore_transaction(uuid, uuid, integer, text) is
  'Implementación de la reversión de una anulación. Deja el movimiento publicado otra vez y apunta el evento; recuperar algo que no estaba anulado no cambia nada.';

create function public.void_transaction(
  p_household_id uuid,
  p_transaction_id uuid,
  p_expected_version integer,
  p_reason text default null
)
returns public.transactions
language sql
security definer
set search_path = ''
as $$
  select * from private.void_transaction(p_household_id, p_transaction_id, p_expected_version, p_reason);
$$;

comment on function public.void_transaction(uuid, uuid, integer, text) is
  'Frontera de escritura para anular un movimiento. Es reversible: `public.restore_transaction` lo devuelve al libro.';

create function public.restore_transaction(
  p_household_id uuid,
  p_transaction_id uuid,
  p_expected_version integer,
  p_reason text default null
)
returns public.transactions
language sql
security definer
set search_path = ''
as $$
  select * from private.restore_transaction(p_household_id, p_transaction_id, p_expected_version, p_reason);
$$;

comment on function public.restore_transaction(uuid, uuid, integer, text) is
  'Frontera de escritura para deshacer una anulación.';

-- Los privilegios por omisión están revocados desde la migración de cimientos,
-- así que sin estas concesiones nadie ejecuta nada. Solo `authenticated`:
-- `service_role` no tiene `auth.uid()`, así que estas funciones no le servirían.
revoke all on function private.transaction_by_idempotency_key(uuid, text, uuid) from public;
revoke all on function private.create_transaction(uuid, public.transaction_kind, numeric, date, text, text, text) from public;
revoke all on function private.void_transaction(uuid, uuid, integer, text) from public;
revoke all on function private.restore_transaction(uuid, uuid, integer, text) from public;

revoke all on function public.create_transaction(uuid, public.transaction_kind, numeric, date, text, text, text) from public, anon;
revoke all on function public.void_transaction(uuid, uuid, integer, text) from public, anon;
revoke all on function public.restore_transaction(uuid, uuid, integer, text) from public, anon;

grant execute on function public.create_transaction(uuid, public.transaction_kind, numeric, date, text, text, text) to authenticated;
grant execute on function public.void_transaction(uuid, uuid, integer, text) to authenticated;
grant execute on function public.restore_transaction(uuid, uuid, integer, text) to authenticated;
