# Lecciones

Actualizado: 2026-09-15

Esto es lo único que Arca hereda de las dos versiones anteriores del producto.
Cada punto **pasó de verdad** y costó una migración correctiva, un incidente o
un rediseño. No es teoría: es la factura ya pagada.

**De lectura obligatoria antes de tocar dinero, esquema o permisos.**

Las versiones anteriores llegaron a 32 migraciones, 22 tablas, ~60 políticas RLS
y una suite de 131 aserciones. No fracasaron por falta de rigor técnico:
fracasaron por exceso de alcance. Esa es la lección número cero.

---

## L0 · El alcance mata antes que los bugs

**Qué pasó.** La versión 2 llevaba, a la vez: partida doble, sobres
presupuestarios, recurrentes idempotentes, importación de extractos de tres
bancos, estrategias de amortización de deuda, cierre mensual reversible con PDF
versionado, push web, correo, exportación de privacidad y sincronización en
tiempo real. Todo a medias, nada cerrado, y seis cambios sin commitear el día
que se borró.

**Regla.** Un pilar se cierra entero —usable, probado, en el móvil— antes de
abrir el siguiente. Si algo no sirve a «apuntar rápido y ver cómo vamos», espera.

---

## Seguridad

### L1 · Pasar una función a `security definer` desactiva RLS

**Síntoma.** Una función privilegiada escribía sin comprobar nada.
**Causa.** La implementación original era `security invoker` y **confiaba en
RLS**. Al moverla a `private` y hacerla `definer` para poder escribir, siguió
confiando en una RLS que ya no se le aplicaba.
**Regla.** Cuando una función pasa a `definer`, su autorización **se reescribe a
mano** en su primera línea útil: comprobación explícita de pertenencia al hogar.
Fue el agujero más grave del proyecto.

### L2 · El proveedor instala cosas en `public`

**Síntoma.** Una función `security definer` que nadie había escrito, ejecutable
por los roles de la API.
**Causa.** Supabase instala un ayudante propio al activar RLS automática.
**Regla.** Auditar también lo que no has escrito tú. Revocar lo que aparezca en
`public` y no sea del proyecto.

### L3 · No existe la política permisiva temporal

**Síntoma.** Políticas de beta con `using (true)` que hubo que sustituir a mano
por comprobaciones por verbo y por rol.
**Regla.** Se nace con la política correcta. «Lo afinamos después» no llega.

### L4 · Una tabla con RLS y sin privilegios falla en silencio

**Síntoma.** Tabla protegida que simplemente no dejaba escribir, sin error claro.
**Regla.** Cada tabla: RLS activada **más** `revoke ... from anon` **más**
`grant` explícito a `authenticated` y `service_role`.

### L5 · Una sola frontera de escritura

**Regla.** Las mutaciones de dinero entran por funciones públicas estrechas que
delegan en implementaciones privadas. El cliente autenticado **no** escribe
directamente en las tablas del libro, y el anónimo no ejecuta nada.

### L6 · La autorización se comprueba contra la base

**Síntoma.** Tres arreglos de autenticación en el historial, incluido uno de
redirección con sesión caducada.
**Regla.** Rol y permisos se leen de la base, nunca de algo que venga en la
petición. Los destinos de redirección se validan contra una lista propia.

---

## Contabilidad

### L7 · El sobre se deduce, no se elige

**Síntoma.** Para apuntar un gasto había que seleccionar un presupuesto oculto en
el formulario. Rediseño completo del modelo de sobres (una migración de 14 KB).
**Regla.** Un presupuesto es el sobre de sus categorías durante un mes natural.
El movimiento consume el sobre **por categoría y fecha**, sin pedirle nada al
usuario. Y si cambia la categoría o la fecha, los sobres afectados se recalculan.

### L8 · Una cifra, una fuente

**Síntoma.** El panel de inicio mezclaba dinero disponible con deuda, y el
recuento de movimientos no coincidía con la pantalla de movimientos.
**Regla.** Cuatro identidades que ninguna pantalla puede romper:
1. El ingreso del inicio es el ingreso publicado que se ve en movimientos.
2. Las salidas del inicio incluyen gastos **y** pagos de deuda, completos.
3. El disponible del inicio es el flujo neto publicado.
4. Las anuladas se excluyen **igual** en las dos pantallas.

Y un test que compara las dos pantallas, no solo cada una por su lado.

### L9 · Los resultados de conciliación son excluyentes

**Síntoma.** Una fila de banco conciliada con un recurrente se contaba **además**
como duplicada. Doble conteo.
**Regla.** Cada fila aprobada tiene exactamente **un** resultado terminal, y eso
se impone por construcción, no por cuidado al programar.

### L10 · Las cuentas de préstamo no son cuentas normales

**Síntoma.** Hicieron falta tres triggers para impedir que un gasto corriente
apuntara a una cuenta de préstamo.
**Regla.** El saldo de un préstamo solo se mueve mediante un pago de deuda
validado. Nunca es un saldo editable a mano.

### L11 · Dos móviles se pisan

**Regla.** `version` en todo objeto de planificación e `idempotency_key` en todo
formulario: reenviar devuelve la primera fila, no crea la segunda. Desde el día
uno, no cuando aparezca el problema.

---

## Esquema y migraciones

### L12 · La clave foránea compuesta es la barrera de verdad

**Regla.** `foreign key (algo_id, household_id) references tabla(id,
household_id)`. Hace **imposible en la base** que una fila apunte a un objeto de
otro hogar. Es lo mejor del diseño anterior y lo primero que hay que replicar.
La política RLS es la segunda barrera, no la única.

### L13 · El orden de las migraciones no es negociable

- Los valores de `enum` van **solos, en su propia migración**: Postgres exige que
  estén confirmados antes de referenciarlos.
- Para un `not null`: columna opcional → relleno de lo histórico → restricción.
  Al revés falla, y ya falló (`migrate historical fields before constraints`).
- Una migración aplicada **no se edita**: se corrige con otra encima.
- Nunca aplicar SQL desde el panel web: el historial local y el remoto divergen
  y hay que repararlo a mano.

### L14 · Los apellidos de versión se acumulan

**Síntoma.** `update_transaction_v2` y `v3`, `post_recurring_item` + `_impl` +
`_v2`, `create_debt_plan` + `_v2` + `_with_method`, triggers `_v3`.
**Regla.** Decidir **antes** cómo evoluciona una función de base. Si hay que
cambiar su forma, se documenta la convención; no se le añade un sufijo.

### L15 · El importador de extractos es la pieza más frágil de todas

**Qué pasó.** Es, con diferencia, lo que más problemas dio: soporte para Unicaja,
CaixaBank y formatos antiguos, filas de ingreso omitidas, duplicados en la
previsualización, recuentos que no acumulaban, y dos migraciones finales solo
para **reparar lotes ya confirmados**. Los últimos commits del proyecto eran
todos de esto.
**Reglas.**
1. La importación entra **después** de que los cuatro pilares estén cerrados.
2. Se aísla: su fallo no puede corromper el libro.
3. Nace con vía de reparación de lotes ya confirmados. La va a necesitar.
4. Los ficheros originales se procesan en el dispositivo y **no se suben**.

---

## Proceso

### L16 · Memoria compartida en el repo, no en la conversación

**Por qué.** Claude y Codex trabajan en el mismo proyecto y el historial de una
conversación no es fuente estable ni visible para el otro. Se descartó memoria
por agente (divergen) y contexto solo en conversación (no es portable ni
auditable).
**Regla.** Lo que haya que conservar va a esta bóveda, versionada.

### L17 · Lo verificado y lo supuesto no se mezclan

**Qué pasó.** La última revisión dejó por ejecutar la suite de 131 aserciones
—Docker no estaba levantado— y aun así el trabajo se dio por bueno.
**Regla.** Si una comprobación no se ha ejecutado, se dice. «Pasa con huecos» es
una respuesta válida; «pasa» sin haberlo visto, no.

### L18 · Lo callado es peor que lo roto

**Qué pasó.** En un proyecto hermano, los despliegues quedaban bloqueados sin
avisar y se dieron por publicados tres cambios que nunca salieron.
**Regla.** Todo automatismo confirma que **terminó bien**, no que se lanzó.

### L19 · La regla que no es un test, no existe

**Regla.** Las reglas duras de `AGENTS.md` que se puedan comprobar se convierten
en pruebas que fallan la suite. La documentación se ignora; una prueba roja, no.

### L20 · Un guardián tiene que poder fallar donde se ejecuta

**Qué pasó.** 2026-09-15, primer push de Arca: el CI falló al instante. El paso
`agentes:check` comparaba los `.toml` generados con los del repositorio, pero esos
ficheros están en `.gitignore` a propósito, así que en un checkout limpio no
existía ninguno y los siete salían «desfasados». La comprobación no podía pasar
nunca.

**Regla.** Antes de meter una comprobación en CI, pregúntate qué ve CI: solo lo
que está versionado. Una comprobación sobre artefactos generados es **local**. Si
quieres que CI aporte algo ahí, que valide lo que sí viaja: en este caso, que cada
agente se pueda generar y esté bien declarado.

### L21 · El `usage` de esquema no frena a una política, pero sí a una llamada directa

**Qué pasó.** 2026-09-16. La migración de cimientos revocó `usage` sobre `private`
a `anon` y `authenticated`. Al revisar el modelo de la fase 1 se dio por hecho
que eso rompería toda política RLS que llamara a
`private.is_household_member(...)`, y llegó a escribirse una migración correctora
para conceder ese `usage`. Era falso, y se vio en dos consultas:

- Una política RLS **sí** invoca `private.*` sin `usage` de esquema: devolvió la
  fila con el privilegio revocado. El `usage` se comprueba al crear la política,
  no al evaluarla.
- Una llamada **directa** de `authenticated` a esa misma función, con su
  `grant execute` puesto, falla con `42501 permission denied for schema private`.

**Regla.** `private` se queda **sin** `usage` para los roles de la API: las
políticas siguen funcionando y las llamadas directas quedan cortadas, que es
exactamente lo que se busca. Y la lección de fondo: **esto no se razona, se
prueba.** Dos agentes sostenían lo contrario con argumentos razonables; dos
consultas contra la base lo zanjaron en un minuto. Cuando algo dependa de cómo se
comporta Postgres, la respuesta la da Postgres.

### L22 · Las herramientas te editan el `.gitignore` por su cuenta

**Qué pasó.** `vercel link` añadió `.env*` al final del `.gitignore`. Como iba
**después** del `!.env.example`, volvía a ignorar el fichero de ejemplo; solo
seguía versionado porque ya estaba en el índice. Un clon nuevo lo habría perdido
en cuanto alguien lo tocara.

**Regla.** Después de que una CLI toque el repositorio (`vercel link`,
`supabase init`, `next dev`), mira el diff antes de commitear. Y en `.gitignore`,
una negación solo vale si nada posterior vuelve a capturar el patrón: las
excepciones se revisan cada vez que algo añade líneas al final.

### L23 · Un despliegue bloqueado no dice que está bloqueado

**Qué pasó.** 2026-09-16. `vercel deploy --prod` terminó con código 0, subió los
ficheros y escribió «Building…». Catorce minutos después seguía en estado
`UNKNOWN` con el build en **0 ms**: nunca llegó a construir. El estado real era
`BLOCKED`, y el motivo, la configuración de equipo frente al autor del commit.
Nada en la salida del comando lo insinuaba.

Probado, no supuesto: el mismo código desplegado desde una copia **sin `.git`**
quedó `Ready` en 21 segundos. Lo que bloquea son los metadatos de git del
commit, no el código.

**Reglas.**
1. Un despliegue no está hecho porque el comando salga con 0: **se comprueba el
   `readyState`**. `BLOCKED` y `ERROR` son estados terminales que hay que mirar a
   propósito.
2. Es la misma trampa que ya costó tres cambios dados por publicados en un
   proyecto hermano. Cuando un automatismo de Vercel calle, sospechar de la
   configuración de equipo antes que del código.
3. El apaño de desplegar sin `.git` sirve para salir del paso; el arreglo de
   verdad es conectar GitHub a la cuenta de Vercel o dar de alta al autor de los
   commits en el equipo.
