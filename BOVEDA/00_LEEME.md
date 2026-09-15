# Bóveda de Arca

Esta carpeta es la memoria del proyecto. Está versionada en git y la leen tanto
Claude Code como Codex. Su contenido debe ser **breve, verificable y útil** para
personas y para agentes.

## Orden de lectura

1. `01_PRODUCTO.md` — qué es Arca y para quién
2. `02_ESTADO_Y_ARQUITECTURA.md` — en qué punto está de verdad
3. `03_LECCIONES.md` — **obligatorio antes de tocar dinero, esquema o permisos**
4. `04_ROADMAP.md` — qué toca ahora
5. `05_RELEVO.md` — dónde quedó la última sesión
6. `DECISIONES/` — solo la decisión que venga al caso

Las reglas duras del proyecto no están aquí: están en `AGENTS.md`, en la raíz.

## Jerarquía de verdad

De más a menos autoridad:

1. El comportamiento comprobado en el código, las migraciones y las pruebas.
2. Las decisiones aceptadas en `DECISIONES/`.
3. El resto de esta bóveda.
4. Suposiciones — y si algo es una suposición, se dice que lo es.

Si la bóveda y el código se contradicen, **gana el código y se avisa de la
diferencia**. No se reescribe la bóveda para tapar el desajuste.

## Reglas de mantenimiento

- Fechas absolutas (`2026-09-15`), nunca «ayer» ni «la semana pasada».
- Se escribe la causa y el por qué, no el relato de la conversación.
- Se actualiza, no se acumula: un documento de estado se sustituye.
- Nada de resúmenes de sesión ni auditorías sueltas en el repo.
- Credenciales: se anota **dónde están** y **cuál sirve**, nunca el valor.
- Si no está claro en qué documento va algo, no se crea uno nuevo: se propone.
