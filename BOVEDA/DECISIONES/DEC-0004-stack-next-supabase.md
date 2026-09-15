# DEC-0004 · Next.js con App Router, Supabase con sesión en cookie, y PWA

Fecha: 2026-09-15 · Estado: aceptada

## Contexto

Arca empieza vacío y hay que elegir la forma de la aplicación. En esta máquina
hay dos moldes probados: Nutria (Next.js 16 App Router, React 19, Tailwind 4,
`@supabase/ssr`, `strict: true`) y Volantia (Vite, React 18, Tailwind 3,
shadcn, un cliente único de Supabase en el navegador, `strict: false`, PWA con
Capacitor).

## Decisión

Molde Nutria: **Next.js 16 con App Router**, React 19, TypeScript con
`strict: true`, Tailwind 4, Supabase con `@supabase/ssr`, npm, Vercel en `dub1`.
Lo móvil se resuelve como **PWA**, sin envoltorio nativo por ahora.

## Por qué

- Las escrituras de dinero tienen que pasar por servidor (regla dura 3). Con App
  Router eso son Server Actions y route handlers sin montar una API aparte.
- La sesión en **cookie** con `@supabase/ssr` permite comprobar la autorización
  antes de renderizar. Con la sesión en `localStorage` toda comprobación ocurre
  ya en el navegador, y la lección L6 dice que la autorización se comprueba
  contra la base, no contra lo que traiga el cliente.
- `strict: true` desde el primer día: el molde alternativo lleva
  `strictNullChecks: false`, y en una app de importes un `undefined` silencioso
  es una cifra equivocada.
- PWA antes que nativo: no hay tienda de aplicaciones en el plan, y un
  envoltorio nativo añade firma, versiones y despliegue que ahora no aportan.

## Alternativas descartadas

- **Vite + SPA (molde Volantia)** — descartado: obligaría a una API aparte para
  todo lo que toque dinero, y la sesión viviría en el navegador.
- **Capacitor desde el principio** — descartado por ahora: coste de
  mantenimiento sin beneficio hasta que haya producto.
- **TypeScript 7 y ESLint 10**, que ya están publicados — descartado de momento:
  `eslint-config-next` 16 y `next typegen` están probados con TypeScript 5 y
  ESLint 9, y la fase 0 no es el sitio para estrenar cadena de herramientas.

## Consecuencias

- `npm run verify` = lint + tipos + pruebas + build, y es lo que decide si algo
  está hecho.
- Habrá tres clientes de Supabase separados (navegador, servidor y
  `service_role` marcado como solo-servidor), como en el molde de referencia.
- Cuando exista el proyecto de Supabase hay que **estrechar el `connect-src`**
  de la CSP al origen concreto: ahora lleva el comodín `*.supabase.co`.
