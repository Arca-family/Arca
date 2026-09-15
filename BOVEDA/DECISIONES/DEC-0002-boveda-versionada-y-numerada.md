# DEC-0002 · La bóveda va versionada en git y numerada

Fecha: 2026-09-15 · Estado: aceptada

## Contexto

En esta máquina conviven dos patrones de bóveda. Volantia tiene `boveda/` en
minúscula, sin numerar, **fuera de git** y servida por un servidor MCP
(`bovedia`): es una base de conocimiento personal. Las versiones anteriores de
este producto usaban `BOVEDA/` numerada y **dentro de git**: era la fuente de
verdad del proyecto. Nutria declara la primera y no la tiene creada, y usa
`docs/` en su lugar.

## Decisión

Arca usa `BOVEDA/` en mayúscula, numerada y versionada en git.

## Por qué

Lo que guarda esta carpeta —qué es el producto, qué se decidió y por qué, qué
lecciones no se repiten— tiene que viajar con el código, poder revisarse en un
diff y estar disponible para Claude y para Codex por igual. Una bóveda fuera de
git no cumple ninguna de las tres.

## Alternativas descartadas

- **`boveda/` minúscula servida por MCP** — descartado para esto: no se versiona
  y no se revisa. Sigue siendo la opción correcta si algún día se quiere una base
  de conocimiento personal; entonces será una carpeta **aparte** y gitignorada.
- **`docs/` sin numerar** — descartado: sin orden de lectura, los agentes abren
  lo que les parece y se gastan el contexto.

## Consecuencias

- La bóveda se actualiza solo cuando cambia el estado, la arquitectura, una
  decisión o el trabajo pendiente.
- Nada de secretos dentro, ni resúmenes de sesión, ni auditorías sueltas.
