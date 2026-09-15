# DEC-0001 · Arca se construye desde cero, sin portar código

Fecha: 2026-09-15 · Estado: aceptada

## Contexto

El producto tuvo dos vidas anteriores (`fondo-familiar` y `fondo-hogar`, esta
última «FONDO FAMILIAR 2.0»): 37 commits, 32 migraciones, 22 tablas, ~60
políticas RLS y 131 aserciones de prueba. Nunca llegó a cerrarse: la última
revisión tenía seis ficheros sin commitear, dos capas de componentes conviviendo
y el importador de extractos roto en producción. El 2026-09-15 se borró todo a
propósito: carpetas, base de datos y despliegue.

Curiosamente, la propia bóveda de aquel proyecto había descartado por escrito
reescribir desde cero, «por riesgo de perder reglas financieras, seguridad e
historial acumulado». Acabó en la papelera de todos modos.

## Decisión

Arca empieza vacío. No se porta código, ni esquema, ni componentes. Lo único que
viaja es el conocimiento, reescrito a mano en `BOVEDA/03_LECCIONES.md`.

## Por qué

El problema de las versiones anteriores no fue la calidad del código: fue el
alcance. Portar el esquema habría traído de vuelta las 22 tablas y las nueve
funciones a medio construir que hacían inabordable cerrar nada.

## Alternativas descartadas

- **Portar el esquema de Supabase completo** — descartado: arrastra el alcance
  entero, que es precisamente lo que hundió el proyecto.
- **Reutilizar el repositorio y aplastar el historial** — descartado: confunde
  dos productos distintos en una misma línea de tiempo.
- **Ignorar también las lecciones** — descartado: los agujeros de seguridad y
  los errores contables ya estaban pagados. Repetirlos no tiene mérito.

## Consecuencias

- `BOVEDA/03_LECCIONES.md` es de lectura obligatoria antes de tocar dinero,
  esquema o permisos, y sus reglas están en `AGENTS.md` como reglas duras.
- Las carpetas anteriores están en la papelera: recuperables un tiempo, no para
  siempre. Lo que había que salvar ya está escrito aquí.
