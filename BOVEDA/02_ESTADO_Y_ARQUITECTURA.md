# Estado y arquitectura

Actualizado: 2026-09-15

## Estado real

**Fase 0 cerrada** el 2026-09-15. **Fase 1 en marcha**: el modelo de datos está
aplicado y verificado el 2026-09-16; falta la interfaz.

### Modelo de datos de la fase 1 (aplicado y probado)

Cinco migraciones, ~1.300 líneas: `households`, `household_members` (roles
`adult`, `helper`, `learner`), catálogo global de 21 categorías en español,
`transactions` con anulación reversible, `transaction_void_events` de solo
añadir, y las vistas encadenadas `household_transactions` →
`household_monthly_totals`. Escritura solo por las funciones de la frontera:
`create_household`, `create_transaction`, `void_transaction`,
`restore_transaction`.

Verificado, no supuesto:
- **md5 idéntico** entre cada fichero local y lo registrado en el proyecto
  remoto: los historiales no divergen.
- **11 de 11 comprobaciones en verde** con datos reales (dos hogares, tres
  personas): aislamiento entre hogares, alcance del menor en aprendizaje, y las
  identidades contables de L8. La prueba vive en
  `supabase/tests/aislamiento_fase_1.sql` y se deshace sola con un `rollback`.
- Dos agujeros encontrados en auditoría **antes** de aplicar: una fuga por la
  clave de idempotencia y un adulto que podía quedarse solo al mando. Los dos
  corregidos en el SQL, no en una migración correctiva.

### Avisos del asesor de Supabase que se aceptan a propósito

Cuatro `WARN` de tipo `authenticated_security_definer_function_executable`, uno
por cada función pública de la frontera. **Es el diseño, no un descuido**: esas
cuatro funciones son el único camino de escritura y cada una comprueba la
pertenencia a mano en su primera línea útil (lección L1). No se «arreglan»
revocando el `execute`: eso dejaría la aplicación sin poder escribir.

Hecho y comprobado (`npm run verify` en verde: lint, tipos, 9 pruebas, build):

- Esqueleto Next.js con App Router, una sola pantalla de comprobación.
- `next.config.ts` con CSP y las cinco cabeceras de seguridad, HSTS incluido.
- `src/lib/dinero.ts` — el único sitio por donde pasa el dinero, con sus
  pruebas y **dos pruebas guardián** que fallan si alguien formatea euros o
  convierte importes por su cuenta.
- `.github/workflows/ci.yml` — `agentes:check`, lint, tipos, pruebas y build.
- 7 agentes en `.claude/agents/` con espejo generado en `.codex/agents/`.
- Esta bóveda. `.cuenta` → `personal`.

Y fuera de la carpeta:

| Recurso | Qué es |
|---|---|
| GitHub | `BigAPP37/Arca`, privado. Rama `main`. |
| Supabase | Proyecto `Arca`, ref `girbdumarikmcctawmql`, región `eu-west-3` (París) |
| Vercel | Proyecto `arca`, `prj_YT5amM3mI5NxOzdDq4l7eHp6rul1`, región `dub1` |
| Producción | https://arca-eosin.vercel.app — 200, CSP con el origen real y las cinco cabeceras verificadas con `curl` |

No existe todavía: autenticación, ni modelo de datos. La base solo tiene el
esquema `private` y los privilegios cerrados.

### Dos cosas pendientes que dependen de ti

1. **Vercel no despliega solo en cada push.** `vercel git connect` falla con
   «You need to add a Login Connection to your GitHub account first»: hay que
   conectar GitHub a la cuenta de Vercel una vez, desde el panel. Hasta
   entonces, el despliegue se lanza a mano con `vercel deploy --prod`.
2. **`SUPABASE_SERVICE_ROLE_KEY` está vacía** en `.env.local`. Se copia del
   panel de Supabase cuando haga falta escribir desde el servidor con
   privilegios.
3. **El `SUPABASE_ACCESS_TOKEN` de la cuenta `personal` ya no vale.** La API de
   gestión lo rechaza en todas las rutas, así que la CLI de Supabase no puede
   enlazar ni empujar migraciones. Hay que regenerarlo en el panel de Supabase y
   pegarlo en `~/.config/cuentas/personal.env`. Mientras tanto, las migraciones
   se aplican por el conector.

## Operación

- **Migraciones.** El fichero de `supabase/migrations/` es la fuente de verdad y
  su nombre lleva la versión exacta que está registrada en el proyecto remoto.
  La primera se aplicó por el conector de Supabase porque la contraseña de la
  base no está disponible en esta máquina; para usar `supabase db push` hay que
  enlazar el proyecto con ella (`supabase link --project-ref
  girbdumarikmcctawmql`). Nunca desde el editor SQL del panel: eso es lo que
  hace divergir los dos historiales.
- **Credenciales.** Al entrar en la carpeta, el terminal carga la cuenta
  `personal` desde `~/.config/cuentas/personal.env` (ahí están
  `SUPABASE_ACCESS_TOKEN` y `VERCEL_TOKEN`). No se exportan a mano.
- **Despliegue.** `vercel deploy --prod` desde la raíz, con la cuenta cargada.

## Stack

Decidido el 2026-09-15 (ver `DECISIONES/DEC-0004`):

| Pieza | Elección |
|---|---|
| Framework | Next.js 16.3.5, App Router, React 19.3 |
| Lenguaje | TypeScript 5 con `strict: true`, `paths {"@/*": ["./src/*"]}` |
| Estilos | Tailwind 4 |
| Base de datos y auth | Supabase con `@supabase/ssr` (sesión en cookie) |
| Validación | zod 4 |
| Pruebas | `tsx --test tests/*.test.ts` (runner de Node, sin framework) |
| Lint | ESLint 9 con `eslint-config-next/core-web-vitals` |
| Paquetes | npm con `package-lock.json` versionado |
| Despliegue | Vercel, región `dub1` |
| Forma de la app | PWA, sin envoltorio nativo por ahora |

Supuestos de producto: España, EUR, `Europe/Madrid`, interfaz en español.

## Cómo se organiza el código

- `src/app/` — rutas del App Router. Las rutas nuevas, en español.
- `src/lib/` — dominio puro y testeable, sin dependencias del framework.
  `dinero.ts` manda en todo lo que sea un importe.
- `tests/` — fuera de `src/`, pruebas unitarias y guardianes.
- `supabase/` — cuando exista: `config.toml` y `migrations/`.
- `scripts/agentes/` — sincronización de agentes con Codex.

Las escrituras de dinero irán por servidor (Server Actions o funciones RPC de
Postgres), nunca directas desde el navegador. Ver regla dura 3 de `AGENTS.md`.

## Decisiones de implementación ya tomadas

- **Dentro del programa, un importe es un entero de céntimos**; en la base,
  `numeric(14,2)`. La conversión ocurre solo en los bordes (`aCentimos`,
  `formatear`, `aNumericSql`). No se usa BigInt: el techo de `numeric(14,2)`
  cabe de sobra en un entero exacto de JavaScript, y se rechaza lo que pase.
- **El separador de millar se fuerza siempre** («1.234,56 €»), aunque el español
  admita «1234,56» sin punto: en una lista de importes la mezcla se lee peor.
- El espacio entre cifra y € es **duro** (U+00A0) a propósito, para que el
  símbolo no salte de renglón en una pantalla estrecha.

## Historia previa

Arca sustituye a dos intentos anteriores del mismo producto (`fondo-familiar` y
`fondo-hogar`, este último «FONDO FAMILIAR 2.0»). El 2026-09-15 se borró todo a
propósito: carpetas, repositorio de GitHub, proyecto de Vercel y proyecto de
Supabase. No se porta código. Lo único que viaja de ahí son las lecciones de
`03_LECCIONES.md`.
