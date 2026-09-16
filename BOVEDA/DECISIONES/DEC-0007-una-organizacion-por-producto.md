# DEC-0007 · Una organización de GitHub por producto, no una cuenta por producto

Fecha: 2026-09-16 · Estado: aceptada

## Contexto

Dos fallos seguidos hicieron pensar que el problema era tener una sola cuenta de
GitHub para todos los proyectos: un despliegue de Vercel que se quedó en
`BLOCKED` sin avisar, y el `SUPABASE_ACCESS_TOKEN` de la cuenta `personal`
caducado. La idea inicial fue crear **una cuenta de GitHub por producto**, cada
una con su cuenta de Vercel, mientras todo siguiera en plan gratuito.

Al revisarlo, ninguna de las dos causas tenía que ver con el número de cuentas:

- El `BLOCKED` era la conexión de login entre GitHub y Vercel sin establecer. El
  propio `vercel git connect` lo decía con esas palabras.
- El token estaba caducado, sin más.

Y los términos de servicio de GitHub dicen, literalmente, «One person or legal
entity may maintain no more than one free Account», más una cuenta máquina. Varias
cuentas gratis a nombre de la misma persona es motivo de suspensión, y ahí viven
los repositorios.

## Decisión

Una **organización** de GitHub por producto, bajo la misma cuenta personal
`BigAPP37`. Arca vive en `Arca-family/Arca`. Los commits siguen firmándose como
BigAPP37: lo que cambia es quién posee el repositorio, no quién escribe.

## Por qué

Da la separación que se buscaba —repositorios y permisos por producto— gratis,
sin límite de organizaciones y sin saltarse ningún término. Y no multiplica
credenciales locales, que era el otro coste escondido de la idea original.

## Alternativas descartadas

- **Una cuenta de GitHub por producto** — descartada: va contra los términos de
  servicio y el riesgo es la suspensión de la cuenta que guarda todo.
- **Dejarlo como estaba** — descartada: la separación por producto es razonable
  y con organizaciones no cuesta nada.

## Consecuencias

- Al crear un proyecto nuevo, primero su organización; el repositorio nace dentro.
- Transferir un repositorio cambia su URL. GitHub redirige, pero hay que
  actualizar el remoto local y cualquier integración que apunte al repositorio.
  Por eso Arca se movió estando recién creada y **Nutria y Volantia no**: están
  desplegadas, y mover un repositorio vivo puede romper su despliegue.
- La tabla de `~/.codex/AGENTS.md` es la que dice dónde vive cada repositorio: se
  actualiza en el mismo momento del cambio, no después.
