# Arca

El fondo común del hogar. Cuentas, gastos del día a día, presupuesto por
categorías y deudas, compartido entre quienes viven juntos.

Las reglas del proyecto están en [AGENTS.md](AGENTS.md) y la memoria en
[BOVEDA/](BOVEDA/00_LEEME.md). Empieza por ahí.

## Arrancar desde cero

```bash
npm install
cp .env.example .env.local   # y rellénalo
npm run dev
```

## Comprobar

```bash
npm run verify   # lint + tipos + pruebas + build
```

Por separado: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Agentes

Se escriben una vez en `.claude/agents/*.md` y se generan para Codex:

```bash
npm run agentes:sync    # regenera .codex/agents/
npm run agentes:check   # falla si alguno está desfasado
npm run codex           # abre Codex con los agentes registrados
```

## Estado

Fase 0: cimientos. Todavía no hay producto. El plan está en
[BOVEDA/04_ROADMAP.md](BOVEDA/04_ROADMAP.md).
