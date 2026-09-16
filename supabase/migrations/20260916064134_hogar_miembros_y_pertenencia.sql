-- El hogar, quién pertenece a él y las funciones de pertenencia que usan todas
-- las políticas del proyecto. Primera tabla real de Arca.
--
-- Qué hace:
--   1. `public.households` — el fondo común. España, EUR y Europe/Madrid van
--      fijados con `check`: la columna existe para que el día que haya otro país
--      sea una migración explícita y no un dato suelto que nadie revisó.
--   2. `public.household_members` — el vínculo entre una cuenta de Supabase y un
--      hogar, con su rol. Lleva `unique (id, household_id)` porque es el destino
--      de las claves foráneas compuestas del resto del modelo (lección L12).
--   3. `private.*` — las funciones de pertenencia. Son `security definer`, así
--      que **no** se les aplica RLS: la autorización se escribe a mano dentro
--      (lección L1, el agujero más grave de la versión anterior). Al ser del
--      dueño de las tablas, leen `household_members` sin RLS y por eso la
--      política de esa misma tabla puede llamarlas sin recursión infinita.
--   4. Dos guardas sobre la pertenencia: un adulto no puede degradar ni dar de
--      baja a otro adulto (política), y un hogar no puede quedarse sin ningún
--      adulto activo (disparador). Entre iguales, nadie se queda solo al mando
--      del libro compartido porque haya llegado antes al botón.
--   5. `public.create_household` — el arranque. Un usuario nuevo no puede
--      insertar su primera pertenencia (la política exige ser ya adulto del
--      hogar), así que el hogar y su primer adulto nacen juntos, en una sola
--      transacción y por la frontera de escritura (lección L5).
--
-- Lecciones que protege: L1, L3, L4, L5, L11, L12, L13, L14.
--
-- Convenciones que se fijan aquí para todo el proyecto:
--   · Privilegios: `revoke all` a `anon` **y** a `authenticated` antes de
--     conceder, porque Supabase concede solo a las tablas nuevas de `public` y
--     un privilegio heredado sin querer no se ve (lección L4). Lo que puede
--     escribir el cliente se concede **por columna**.
--   · Ningún rol de la API tiene `delete` en ninguna tabla de Arca,
--     `service_role` incluido. Nada de lo que toca dinero o autoría se borra:
--     se marca. Borrar de verdad es una migración, que deja fichero.
--   · Nunca `force row level security`: las funciones `definer` de Arca son del
--     dueño de las tablas y dependen de ese salto de RLS.
--   · `updated_at` y `version` los pone un disparador, no quien escribe, para
--     que nadie se pueda olvidar (lección L11).
--   · Nombres de función sin sufijo de versión, jamás (lección L14). Si una
--     función tiene que cambiar de forma, se reemplaza en su sitio con otra
--     migración; los parámetros nuevos se añaden al final con valor por omisión.

-- ---------------------------------------------------------------------------
-- 1. El hogar
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint households_name_shape check (btrim(name) <> '' and char_length(name) <= 60),
  country text not null default 'ES'
    constraint households_country_spain check (country = 'ES'),
  currency text not null default 'EUR'
    constraint households_currency_eur check (currency = 'EUR'),
  time_zone text not null default 'Europe/Madrid'
    constraint households_time_zone_madrid check (time_zone = 'Europe/Madrid'),
  created_by uuid not null,
  version integer not null default 1
    constraint households_version_positive check (version > 0),
  idempotency_key text not null
    constraint households_idempotency_key_shape check (char_length(idempotency_key) between 8 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_created_by_fk foreign key (created_by)
    references auth.users (id) on delete restrict,
  constraint households_creator_idempotency_unique unique (created_by, idempotency_key)
);

comment on table public.households is
  'Un fondo común: las personas que viven juntas y llevan el dinero compartido. Es la raíz del aislamiento entre hogares; toda tabla del modelo cuelga de aquí por `household_id`.';
comment on column public.households.name is
  'Cómo llaman al hogar sus miembros. Solo se usa en la interfaz.';
comment on column public.households.country is
  'Fijado a ES con un `check`. La columna existe para que añadir otro país sea una migración consciente, no un dato inesperado en una cifra.';
comment on column public.households.currency is
  'Fijado a EUR con un `check`. Mientras haya una sola moneda, ningún importe necesita conversión y no hay forma de sumar peras con manzanas.';
comment on column public.households.time_zone is
  'Fijado a Europe/Madrid con un `check`. Es la zona con la que se decide a qué mes pertenece un movimiento; si algún día varía, la vista de totales tiene que revisarse a la vez.';
comment on column public.households.created_by is
  'Cuenta que creó el hogar. Es rastro de auditoría, no permiso: quien manda es el rol en `household_members`. `on delete restrict` a propósito: una cuenta con rastro en Arca no desaparece en cascada.';
comment on column public.households.version is
  'Bloqueo optimista. Lo sube el disparador en cada `update`; quien escribe manda `where version = <la que leyó>` y, si no actualiza ninguna fila, es que otro móvil llegó antes (lección L11).';
comment on column public.households.idempotency_key is
  'Clave que manda el formulario de creación. Con `unique (created_by, idempotency_key)`, reenviarlo devuelve el hogar que ya existe en vez de crear un segundo (lección L11).';

-- ---------------------------------------------------------------------------
-- 2. Quién pertenece al hogar
-- ---------------------------------------------------------------------------

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  user_id uuid not null,
  role public.household_role not null,
  display_name text not null
    constraint household_members_display_name_shape check (btrim(display_name) <> '' and char_length(display_name) <= 40),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  version integer not null default 1
    constraint household_members_version_positive check (version > 0),
  idempotency_key text not null
    constraint household_members_idempotency_key_shape check (char_length(idempotency_key) between 8 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_household_fk foreign key (household_id)
    references public.households (id) on delete restrict,
  constraint household_members_user_fk foreign key (user_id)
    references auth.users (id) on delete restrict,
  constraint household_members_left_after_joined check (left_at is null or left_at >= joined_at),
  constraint household_members_id_household_unique unique (id, household_id),
  constraint household_members_idempotency_unique unique (household_id, idempotency_key)
);

-- Regla «solo una activa»: una persona no puede tener dos pertenencias vivas en
-- el mismo hogar, pero sí quedar su histórico cuando se va y vuelve.
create unique index household_members_active_user_uidx
  on public.household_members (household_id, user_id)
  where left_at is null;

-- «¿De qué hogares soy miembro?» es la primera consulta de cada sesión.
create index household_members_user_idx
  on public.household_members (user_id)
  where left_at is null;

comment on table public.household_members is
  'Pertenencia de una cuenta a un hogar, con su rol. Una fila no se borra nunca: se marca con `left_at`, porque los movimientos que apuntó esa persona siguen apuntando aquí y el rastro del autor no se pierde.';
comment on column public.household_members.id is
  'Identidad del miembro **dentro del hogar**. Es lo que guardan los movimientos como autor, no el `user_id`, para que la clave foránea compuesta pueda comprobar el hogar a la vez (lección L12).';
comment on column public.household_members.user_id is
  'Cuenta de Supabase. `on delete restrict`: borrar la cuenta de alguien con historial exige decidir antes qué pasa con su rastro, y eso no es de la fase 1.';
comment on column public.household_members.role is
  'Sin valor por omisión a propósito: el rol se declara siempre, para que un `insert` incompleto falle en vez de crear un adulto con todos los permisos.';
comment on column public.household_members.display_name is
  'Nombre con el que aparece en el hogar. Se guarda aquí y no se lee de `auth.users` para no exponer datos de la cuenta al resto de miembros.';
comment on column public.household_members.left_at is
  'Fecha en la que dejó el hogar. Mientras sea nulo, la pertenencia está activa: es la condición que usan todas las funciones de pertenencia y el índice único parcial.';
comment on column public.household_members.version is
  'Bloqueo optimista, igual que en `households` (lección L11).';
comment on column public.household_members.idempotency_key is
  'Clave del formulario que dio de alta al miembro: reenviarlo no crea una segunda pertenencia (lección L11).';

-- ---------------------------------------------------------------------------
-- 3. Sellos y guardas de la pertenencia
-- ---------------------------------------------------------------------------

create function private.stamp_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Ni `updated_at` ni `version` los decide quien escribe: así ninguna función
  -- ni ningún `update` directo puede olvidarse de subir la versión y dejar a dos
  -- móviles pisándose sin enterarse (lección L11).
  new.updated_at := now();
  new.version := old.version + 1;
  return new;
end;
$$;

comment on function private.stamp_update() is
  'Disparador `before update`: pone `updated_at` con la hora del servidor y sube `version`. Va en `private` para que no aparezca como función de la API.';

-- Los disparadores comprueban el privilegio de ejecución al crearse, pero se
-- concede también para que un cambio futuro en esa comprobación no deje las
-- escrituras del cliente muertas sin explicación (lección L4).
revoke all on function private.stamp_update() from public;
grant execute on function private.stamp_update() to authenticated;

create trigger households_stamp_update
  before update on public.households
  for each row execute function private.stamp_update();

create trigger household_members_stamp_update
  before update on public.household_members
  for each row execute function private.stamp_update();

-- Un hogar sin ningún adulto activo es un libro compartido que ya nadie puede
-- configurar, y no se arregla desde la aplicación: dar de alta a un miembro exige
-- ser adulto del hogar. La regla mira **otras filas** de la tabla, así que no cabe
-- en un `check`; va en una guarda.
create function private.require_active_adult()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid;
begin
  -- En un disparador de `delete` no existe `new`: leerlo daría error en vez de
  -- comprobar nada.
  if tg_op = 'DELETE' then
    v_household_id := old.household_id;
  else
    v_household_id := new.household_id;
  end if;

  if not exists (
    select 1
    from public.household_members m
    where m.household_id = v_household_id
      and m.role = 'adult'::public.household_role
      and m.left_at is null
  ) then
    raise exception 'El hogar se quedaría sin ningún adulto activo: nombra antes a otro adulto.'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

comment on function private.require_active_adult() is
  'Guarda: después de cambiar un rol o una baja, el hogar tiene que seguir teniendo al menos un adulto activo. Un adulto puede irse o degradarse él solo, pero no ser el último. Como comprueba en el momento, un relevo dentro de la misma transacción tiene que nombrar al nuevo adulto antes de retirar al viejo.';

revoke all on function private.require_active_adult() from public;
grant execute on function private.require_active_adult() to authenticated;

create trigger household_members_require_active_adult
  after update of role, left_at or delete on public.household_members
  for each row execute function private.require_active_adult();

-- ---------------------------------------------------------------------------
-- 4. Funciones de pertenencia
-- ---------------------------------------------------------------------------
-- Todas `security definer` con `set search_path = ''`. Al ser del dueño de las
-- tablas, saltan la RLS de `household_members`: eso es lo que permite usarlas
-- dentro de la política de esa misma tabla sin recursión, y es también lo que
-- obliga a que la autorización se escriba a mano en cada función que escriba
-- dinero (lección L1).
--
-- Se ejecutan desde políticas RLS, y para eso hace falta `execute` explícito
-- porque la migración de cimientos revocó los privilegios por omisión. No se les
-- concede `usage` sobre el esquema `private`: el cliente no puede llamarlas por
-- su nombre, solo Postgres al evaluar una política.

create function private.household_member_role(p_household_id uuid)
returns public.household_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.household_members m
  where m.household_id = p_household_id
    and m.user_id = (select auth.uid())
    and m.left_at is null;
$$;

comment on function private.household_member_role(uuid) is
  'Rol de quien consulta en ese hogar, o nulo si no es miembro activo. Es la única lectura de pertenencia del proyecto: las demás funciones se apoyan en esta para que la regla viva en un solo sitio.';

create function private.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.household_member_role(p_household_id) is not null;
$$;

comment on function private.is_household_member(uuid) is
  'Cierto si quien consulta pertenece al hogar. Devuelve booleano, nunca nulo, para que una política nunca dependa de cómo trate el nulo.';

create function private.is_household_adult(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.household_member_role(p_household_id) = 'adult'::public.household_role, false);
$$;

comment on function private.is_household_adult(uuid) is
  'Cierto si quien consulta es adulto del hogar. Es el único permiso de configuración que existe en la fase 1: cambiar el hogar y gestionar a los miembros.';

create function private.can_read_all_transactions(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.household_member_role(p_household_id)
      in ('adult'::public.household_role, 'helper'::public.household_role),
    false
  );
$$;

comment on function private.can_read_all_transactions(uuid) is
  'Cierto para adulto y para el hijo mayor que ayuda; falso para el menor en aprendizaje, que solo ve lo suyo. La regla del perfil `learner` vive aquí y en ningún otro sitio.';

create function private.current_household_member_id(p_household_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.household_members m
  where m.household_id = p_household_id
    and m.user_id = (select auth.uid())
    and m.left_at is null;
$$;

comment on function private.current_household_member_id(uuid) is
  'Identidad de miembro de quien consulta en ese hogar, o nulo si no pertenece. Es lo que se guarda como autor de un movimiento.';

revoke all on function private.household_member_role(uuid) from public;
revoke all on function private.is_household_member(uuid) from public;
revoke all on function private.is_household_adult(uuid) from public;
revoke all on function private.can_read_all_transactions(uuid) from public;
revoke all on function private.current_household_member_id(uuid) from public;

grant execute on function private.household_member_role(uuid) to authenticated;
grant execute on function private.is_household_member(uuid) to authenticated;
grant execute on function private.is_household_adult(uuid) to authenticated;
grant execute on function private.can_read_all_transactions(uuid) to authenticated;
grant execute on function private.current_household_member_id(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Privilegios y RLS
-- ---------------------------------------------------------------------------
-- Una tabla con RLS y sin privilegios falla en silencio, y una con privilegios
-- heredados sin querer se abre sin que nadie lo vea (lección L4). Por eso se
-- revoca primero a los dos roles de la API y se concede después lo justo.

alter table public.households enable row level security;
alter table public.household_members enable row level security;

revoke all on table public.households from anon, authenticated;
revoke all on table public.household_members from anon, authenticated;

grant select on table public.households to authenticated;
grant update (name) on table public.households to authenticated;
grant select, insert, update on table public.households to service_role;

grant select on table public.household_members to authenticated;
grant insert (household_id, user_id, role, display_name, idempotency_key) on table public.household_members to authenticated;
grant update (role, display_name, left_at) on table public.household_members to authenticated;
grant select, insert, update on table public.household_members to service_role;

-- No hay `insert` de hogares para el cliente: el arranque es
-- `public.create_household`, que crea hogar y primer adulto en la misma
-- transacción. Tampoco hay `delete` en ninguna de las dos tablas **para ningún
-- rol de la API**, `service_role` incluido: un hogar con movimientos no se borra,
-- y un miembro se marca con `left_at` para no perder la autoría de lo que apuntó.
-- Borrar de verdad es cosa de una migración, que se ejecuta como dueño y queda en
-- el historial.

create policy households_select_own on public.households
  for select to authenticated
  using (private.is_household_member(id));

create policy households_update_own on public.households
  for update to authenticated
  using (private.is_household_adult(id))
  with check (private.is_household_adult(id));

create policy household_members_select_own on public.household_members
  for select to authenticated
  using (private.is_household_member(household_id));

create policy household_members_insert_own on public.household_members
  for insert to authenticated
  with check (private.is_household_adult(household_id));

-- Solo los adultos actualizan pertenencias, y no existe una política para
-- «editar lo mío»: una política de fila no puede limitar qué columnas cambian, y
-- con ella un `learner` podría ascenderse a `adult`. Cambiar el propio nombre
-- visible pasará por una función estrecha cuando haga falta.
--
-- Y un adulto no toca la fila de otro adulto. Arca es un fondo entre iguales: si
-- un adulto pudiera degradar al otro a `learner` o ponerle `left_at`, se quedaría
-- solo al mando del libro compartido sin que nadie lo hubiera aprobado. La
-- condición va en el `using`, que mira la fila **antes** del cambio:
--   · adulto sobre `helper` o `learner`: sí, incluido ascenderlo a adulto;
--   · adulto sobre su propia fila: sí, puede irse o degradarse él;
--   · adulto sobre otro adulto: la fila ni siquiera es actualizable.
-- El `with check` no repite la condición a propósito: si la repitiera, ascender a
-- alguien a adulto fallaría, porque la fila resultante ya sería la de otro adulto.
-- Quitar a alguien del hogar sin su permiso no es una operación de la fase 1; si
-- llega a hacer falta, será una función de la frontera con su regla escrita.
create policy household_members_update_own on public.household_members
  for update to authenticated
  using (
    private.is_household_adult(household_id)
    and (
      role <> 'adult'::public.household_role
      or user_id = (select auth.uid())
    )
  )
  with check (private.is_household_adult(household_id));

-- ---------------------------------------------------------------------------
-- 6. Arranque: crear el hogar y su primer adulto
-- ---------------------------------------------------------------------------

create function private.create_household(
  p_name text,
  p_display_name text,
  p_idempotency_key text
)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.households;
begin
  -- Primera línea útil: autorización a mano. Esta función es `definer` y aquí no
  -- hay RLS que la cubra (lección L1).
  if v_user_id is null then
    raise exception 'Hay que estar autenticado para crear un hogar.'
      using errcode = '42501';
  end if;

  -- Reenviar el formulario devuelve el hogar que ya existe (lección L11).
  select * into v_row
  from public.households
  where created_by = v_user_id
    and idempotency_key = p_idempotency_key;
  if found then
    return v_row;
  end if;

  insert into public.households (name, created_by, idempotency_key)
  values (btrim(p_name), v_user_id, p_idempotency_key)
  returning * into v_row;

  -- Quien crea el hogar es su primer adulto. Va en la misma transacción: un
  -- hogar sin ningún adulto no sería administrable por nadie.
  insert into public.household_members (household_id, user_id, role, display_name, idempotency_key)
  values (v_row.id, v_user_id, 'adult', btrim(p_display_name), p_idempotency_key);

  return v_row;
exception
  when unique_violation then
    -- Dos envíos a la vez: gana el primero y el segundo devuelve esa misma fila.
    select * into v_row
    from public.households
    where created_by = v_user_id
      and idempotency_key = p_idempotency_key;
    if found then
      return v_row;
    end if;
    raise;
end;
$$;

comment on function private.create_household(text, text, text) is
  'Implementación del arranque de un hogar: crea el hogar y la pertenencia de adulto de quien lo crea, en una sola transacción e idempotente por `idempotency_key`.';

create function public.create_household(
  p_name text,
  p_display_name text,
  p_idempotency_key text
)
returns public.households
language sql
security definer
set search_path = ''
as $$
  select * from private.create_household(p_name, p_display_name, p_idempotency_key);
$$;

comment on function public.create_household(text, text, text) is
  'Frontera de escritura para crear un hogar. Envoltorio estrecho de la implementación en `private` (lección L5). El cliente no inserta en `households` directamente porque no puede crear su propia pertenencia sin ser ya adulto del hogar.';

revoke all on function private.create_household(text, text, text) from public;
revoke all on function public.create_household(text, text, text) from public, anon;
grant execute on function public.create_household(text, text, text) to authenticated;
