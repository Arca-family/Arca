# Relevo

Actualizado: 2026-09-15

```
EN QUÉ SE ESTABA · Fase 0 de Arca: cimientos del proyecto, después de borrar por
  completo las dos versiones anteriores del producto (disco, GitHub, Vercel y
  Supabase, todo confirmado borrado).

DÓNDE QUEDÓ · Lo local hecho y verificado, `npm run verify` en verde (lint,
  tipos, 9 pruebas, build): esqueleto Next.js con App Router, CSP y cabeceras de
  seguridad, `src/lib/dinero.ts` con sus guardianes, CI de GitHub Actions, 7
  agentes con espejo para Codex, y esta bóveda. Repo git local **sin primer
  commit**. Decisiones DEC-0001 a DEC-0005 escritas.

SIGUIENTE PASO · Cerrar la fase 0 con lo que vive fuera de la carpeta: repo
  `BigAPP37/Arca` en GitHub y primer commit, proyecto de Supabase con su primera
  migración aplicada por CLI, proyecto de Vercel, y la fila de Arca en
  `~/.codex/AGENTS.md`. Después, fase 1: hogar, miembros y el primer movimiento.

NO HACER · No portar código de las versiones anteriores: solo viajan las
  lecciones de 03_LECCIONES.md. No meter la importación de extractos antes de la
  fase 5 (DEC-0005). No dejar el comodín `*.supabase.co` en la CSP cuando ya se
  conozca el origen real del proyecto.
```
