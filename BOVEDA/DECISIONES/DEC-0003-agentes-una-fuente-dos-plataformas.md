# DEC-0003 · Los agentes se escriben una vez y se generan para Codex

Fecha: 2026-09-15 · Estado: aceptada

## Contexto

El proyecto lo trabajan Claude Code y Codex. Cada uno lee los agentes en su
formato: Claude en `.claude/agents/*.md` con frontmatter, Codex en ficheros
`.toml` con `developer_instructions`, y además **el registro de agentes de Codex
es global a la máquina**, compartido con el resto de proyectos. En un proyecto
hermano, mantener las dos copias a mano ya provocó que un agente dijera cosas
distintas en cada plataforma.

## Decisión

La fuente de verdad es `.claude/agents/*.md`, que es lo que se versiona. De ahí
se generan `.codex/agents/arca-*.toml` con `scripts/agentes/sync.mjs`, ignorados
en git. El prefijo `arca-` evita choques en el registro global de Codex.

## Por qué

Dos copias escritas a mano divergen. Una sola fuente y un generador con modo
`--check` convierten la divergencia en un fallo detectable.

## Alternativas descartadas

- **Mantener los dos formatos a mano** — descartado: ya falló en otro repo.
- **Registrar los agentes en `~/.codex/config.toml`** — descartado: es global.
  `scripts/agentes/codex.mjs` los pasa con `-c` al arrancar, así existen solo en
  las sesiones de Arca.

## Consecuencias

- Tras editar un `.md`: `node scripts/agentes/sync.mjs`.
- **Corregido el 2026-09-16:** este documento decía que `--check` debía entrar en
  CI. Era un error y CI falló en el primer push. Los `.toml` están fuera de git,
  así que en un checkout limpio no existe ninguno con el que comparar y los siete
  salían como desfasados. El desfase es un problema **local**: se comprueba en la
  máquina con `npm run agentes:check`. Lo que corre en CI es
  `npm run agentes:sync`, que valida que cada agente se pueda generar y esté bien
  declarado; el generador sale con error si a un `.md` le falta el frontmatter o
  la `description`.
- Codex se abre con `node scripts/agentes/codex.mjs`, no con `codex` a secas, o
  no verá los agentes.
- Codex ignora `tools:` y `model:`, así que cada agente lleva sus límites
  escritos dentro del propio prompt.
