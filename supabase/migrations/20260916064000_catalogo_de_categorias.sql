-- El catálogo de categorías: fijo, global y compartido por todos los hogares.
--
-- Qué hace: crea `public.categories` y lo siembra con las categorías de un
-- hogar español. No lleva `household_id`, y esa es la única excepción a la regla
-- de la clave foránea compuesta (lección L12): un catálogo global no pertenece a
-- ningún hogar, así que no hay nada que se pueda filtrar de un hogar a otro. Lo
-- que sí lleva clave foránea compuesta es todo lo que apunta a un miembro.
--
-- Dos decisiones que conviene entender antes de tocar esto:
--
--   1. La clave es un código de texto, no un uuid. Se lee en una consulta
--      (`groceries`), es estable entre entornos y no obliga a nadie a memorizar
--      identificadores generados. La etiqueta en español es dato, no
--      identificador, y se cambia con una migración.
--   2. Cada categoría es de ingreso **o** de gasto, nunca de las dos. Eso
--      permite que `transactions` la referencie con
--      `(category_code, kind) -> categories (code, kind)`, y así la base hace
--      **imposible** apuntar un gasto en «Nómina». Es el mismo truco de la
--      lección L12 aplicado al catálogo. Por eso hay «Otros gastos» y «Otros
--      ingresos» como filas distintas, que además es lo que necesita el selector.
--
-- El catálogo no lleva `version` ni `idempotency_key` a propósito: nadie lo edita
-- desde un móvil ni desde un formulario, solo las migraciones (lección L11).
--
-- Lecciones que protege: L3, L4, L11, L12.

create table public.categories (
  code text primary key
    constraint categories_code_shape check (code ~ '^[a-z][a-z0-9_]{1,30}$'),
  kind public.transaction_kind not null,
  label text not null
    constraint categories_label_shape check (btrim(label) <> '' and char_length(label) <= 40),
  sort_order smallint not null
    constraint categories_sort_order_positive check (sort_order > 0),
  is_active boolean not null default true,
  constraint categories_code_kind_unique unique (code, kind)
);

comment on table public.categories is
  'Catálogo fijo, global y compartido de categorías de gasto e ingreso doméstico español. Solo lo cambian las migraciones: no hay privilegio de escritura para nadie de la API.';
comment on column public.categories.code is
  'Clave estable y legible. En inglés porque es identificador; lo que ve la persona es `label`. Un código no se reutiliza para otra cosa: los movimientos antiguos lo siguen apuntando.';
comment on column public.categories.kind is
  'Si la categoría es de ingreso o de gasto. Forma parte de la clave única `(code, kind)` para que la clave foránea compuesta de `transactions` impida mezclarlos.';
comment on column public.categories.label is
  'Etiqueta en español, la que se pinta en el selector. La interfaz no traduce códigos: lee esta columna.';
comment on column public.categories.sort_order is
  'Orden en el selector, dentro de cada `kind`. Va de diez en diez para que una categoría nueva se pueda colocar en medio sin renumerar; los empates se rompen por etiqueta.';
comment on column public.categories.is_active is
  'Falso retira la categoría del selector sin borrarla. Nunca se borra una categoría con movimientos: eso rompería el histórico. La frontera de escritura rechaza apuntar en una inactiva.';

-- Gasto. Lista corta a propósito: apuntar tiene que costar tres toques, y un
-- selector con cincuenta filas no se recorre en tres segundos.
insert into public.categories (code, kind, label, sort_order) values
  ('groceries',      'expense', 'Compra y supermercado',    10),
  ('home',           'expense', 'Vivienda',                 20),
  ('utilities',      'expense', 'Luz, agua y gas',          30),
  ('telecom',        'expense', 'Móvil e internet',         40),
  ('transport',      'expense', 'Transporte y coche',       50),
  ('dining_out',     'expense', 'Bar y restaurante',        60),
  ('health',         'expense', 'Salud y farmacia',         70),
  ('clothing',       'expense', 'Ropa y calzado',           80),
  ('leisure',        'expense', 'Ocio y viajes',            90),
  ('subscriptions',  'expense', 'Suscripciones',           100),
  ('education',      'expense', 'Educación',               110),
  ('pets',           'expense', 'Mascotas',                120),
  ('gifts',          'expense', 'Regalos y celebraciones', 130),
  ('insurance',      'expense', 'Seguros',                 140),
  ('taxes',          'expense', 'Impuestos y tasas',       150),
  ('other_expense',  'expense', 'Otros gastos',            160);

-- Ingreso.
insert into public.categories (code, kind, label, sort_order) values
  ('salary',          'income', 'Nómina',                    10),
  ('self_employment', 'income', 'Facturación y autónomo',    20),
  ('benefits',        'income', 'Ayudas y prestaciones',     30),
  ('refunds',         'income', 'Devoluciones y reembolsos', 40),
  ('other_income',    'income', 'Otros ingresos',            50);

-- El catálogo es diminuto, pero el selector lo lee en cada alta: con este índice
-- el orden sale del índice y no depende del plan.
create index categories_kind_order_idx
  on public.categories (kind, sort_order)
  where is_active;

-- Privilegios: revocar antes de conceder, porque Supabase concede solo sobre las
-- tablas nuevas de `public` y un privilegio heredado no se ve (lección L4).
alter table public.categories enable row level security;

revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to authenticated;
grant select on table public.categories to service_role;

-- `using (true)` aquí es la semántica correcta, no una política permisiva
-- provisional de las que prohíbe la lección L3: el catálogo es el mismo para
-- todos los hogares y no contiene ningún dato de nadie. No hay política de
-- `insert`, `update` ni `delete` porque no hay privilegio de escritura que
-- gobernar: el catálogo se cambia por migración.
create policy categories_select_all on public.categories
  for select to authenticated
  using (true);
