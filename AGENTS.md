> **Este archivo lo leen tanto Claude Code como Codex.**
> Es la fuente única de reglas del proyecto: lo que cambies aquí
> cambia para los dos. `CLAUDE.md` solo apunta a este archivo.

# Arca

El fondo común del hogar. Cuentas, gastos del día a día, presupuesto por
categorías y deudas, compartido entre las personas que viven juntas y
sincronizado entre sus móviles.

La promesa del producto es **sencillez, rapidez y volver mañana**: apuntar un
gasto tiene que costar tres segundos, y abrir la app tiene que responder de un
vistazo a «¿cómo vamos este mes?». Cualquier función que no sirva a eso se
discute antes de construirse.

## Estado

Proyecto **nuevo, desde cero** (2026-09-15). Tuvo dos vidas anteriores que se
borraron por completo a propósito. No hay código heredado y no se va a portar
ninguno: lo único que viaja del pasado son las lecciones de
`BOVEDA/03_LECCIONES.md`, que son de lectura obligatoria antes de tocar dinero,
esquema o seguridad.

## Stack

**Decidido:** España, EUR, `Europe/Madrid`. Español en UI y en código.
Supabase como base de datos y autenticación. Vercel para desplegar. npm con
`package-lock.json` versionado. TypeScript con `paths {"@/*": ["./src/*"]}`.

**Sin decidir todavía** (no lo supongas, pregunta): framework de la aplicación y
forma de la app. Hasta que se cierre, este archivo no describe rutas ni
carpetas de `src/`, y los agentes no deben inventárselas.

## Reglas duras — NO NEGOCIABLES

Si una tarea te pide algo que las incumple, **para y avisa** en vez de
implementarlo. Cada una está aquí porque ya costó dinero o un incidente en las
versiones anteriores; el detalle está en `BOVEDA/03_LECCIONES.md`.

1. **El dinero es `numeric(14,2)`.** Nunca `float`, nunca `real`, nunca un
   número en coma flotante en JavaScript para sumar importes.
2. **Un hogar nunca ve datos de otro.** Toda tabla hija lleva `household_id` y
   la clave foránea **compuesta** `(algo_id, household_id)`, para que la base
   haga imposible apuntar a un objeto de otro hogar. No basta con la política
   RLS.
3. **Las escrituras de dinero pasan por una sola frontera** (función RPC). Si
   una función pasa a `security definer`, su autorización **se reescribe a
   mano**: ya no hereda RLS. Confiar en que "RLS ya lo cubre" fue un agujero
   real.
4. **Nunca una política permisiva "temporal".** Ni `using (true)` en escritura,
   ni "lo afinamos después". Se nace con la política por verbo y por rol.
5. **Una cifra, una fuente.** Si dos pantallas muestran «disponible», sale del
   mismo cálculo, y hay un test que compara las dos. Mezclar saldo disponible
   con deuda ya rompió la pantalla de inicio una vez.
6. **Multidispositivo desde el primer día:** `version` para no sobrescribirse
   entre dos móviles e `idempotency_key` para que reenviar un formulario no
   duplique el movimiento.
7. **Las migraciones son historial inmutable.** No se edita ni se reordena una
   migración ya aplicada. Los valores de `enum` van en su propia migración.
   Para poner `not null`: columna opcional → relleno → restricción, nunca al
   revés.
8. **Los extractos bancarios originales no se suben al servidor.** Se procesan
   en el dispositivo y solo viajan los movimientos ya normalizados.
9. **Nada de `reset --hard`, `force push`, limpiezas masivas ni borrar lo que
   parezca sobrar.** Si crees que algo es prescindible, dilo y espera.
10. **Móvil primero.** Se diseña y se comprueba a ~375px de ancho. El
    escritorio es adaptación, nunca el punto de partida.
11. **Español** en interfaz, textos, comentarios de código y nombres de
    ficheros de negocio.
12. **Secretos jamás.** No se leen en voz alta, no se pegan en la conversación,
    no se commitean: ni `.env.local`, ni `.mcp.json`, ni tokens.

## Quién usa Arca

El caso base son **dos adultos** en un hogar. El modelo tiene que admitir sin
rediseño: compañeros de piso, un hijo mayor de edad que ayuda a llevarlo, y un
menor en modo aprendizaje con acceso reducido. Eso significa roles desde el
principio, pero **los mínimos**: no se inventan permisos que nadie ha pedido.

## Agentes de este repo

Delegar es más barato que leer. La sesión principal decide y reparte; los
agentes leen, escriben lo suyo y devuelven poco.

| Agente | Modelo | Para qué |
|---|---|---|
| `lectura` | haiku | Localizar y resumir. Siempre antes de tocar nada. Solo lee. |
| `diseno` | sonnet | Pantallas, flujo y sistema visual. Móvil primero. |
| `codigo` | sonnet | Implementar lo acordado, sin salirse del encargo. |
| `datos` | opus | Esquema, migraciones e invariantes contables. |
| `seguridad` | opus | Audita RLS, autenticación y secretos. Reporta, no arregla. |
| `comprobaciones` | haiku | Lint, tipos, pruebas y build. Devuelve si pasa o falla. |
| `boveda` | sonnet | Mantiene `BOVEDA/` y el relevo entre sesiones. |

**Ningún agente ve esta conversación.** Dale rutas exactas y la tarea concreta;
nunca «sigue con lo de antes».

Los agentes se escriben **una sola vez** en `.claude/agents/*.md`. Eso es la
fuente de verdad y es lo que se versiona. Para Codex se traducen a
`.codex/agents/arca-*.toml` (ignorados en git, llevan prefijo porque el
registro de Codex es global a la máquina):

```
node scripts/agentes/sync.mjs           # regenera los .toml
node scripts/agentes/sync.mjs --check   # falla si alguno está desfasado
node scripts/agentes/codex.mjs          # abre Codex con los agentes registrados
```

## La bóveda

`BOVEDA/` es la memoria del proyecto, **versionada en git** y numerada, y la
leen los dos agentes. Orden de lectura y reglas en `BOVEDA/00_LEEME.md`.

Jerarquía de verdad, de más a menos:

1. El comportamiento comprobado en el código, las migraciones y las pruebas.
2. Las decisiones aceptadas en `BOVEDA/DECISIONES/`.
3. El resto de la bóveda.
4. Suposiciones — y si algo es una suposición, se dice que lo es.

Si la bóveda y el código se contradicen, **no elijas en silencio: avisa de la
diferencia.** La bóveda se actualiza solo cuando el cambio altera el estado, la
arquitectura, una decisión o el trabajo pendiente.

## Cómo trabajar en este repo

1. Empieza por `BOVEDA/00_LEEME.md` y por las reglas duras de arriba.
2. Antes de escribir, manda a `lectura` a mirar si ya existe.
3. Cambios pequeños y del tamaño del encargo. Nada de refactores de paso.
4. Toca dinero, esquema o permisos → pasa por `datos` y por `seguridad`.
5. Verifica con `comprobaciones` antes de decir que está hecho.
6. Commits en español, en minúscula, `ámbito: el por qué`. El mensaje explica
   por qué, no qué.

# Organización del ordenador

Antes de crear carpetas, mover ficheros o tocar cuentas, lee
`~/.codex/AGENTS.md` — explica dónde vive cada proyecto y qué cuenta usa cada uno.

Este proyecto usa la cuenta **personal** (se carga sola al entrar en la carpeta; el
fichero `.cuenta` manda). Los commits van siempre como BigAPP37.
