# Relevo

Actualizado: 2026-09-15

```
EN QUÉ SE ESTABA · Fase 0 de Arca, los cimientos, después de borrar por completo
  las dos versiones anteriores del producto (disco, GitHub, Vercel y Supabase,
  las cuatro cosas confirmadas borradas).

DÓNDE QUEDÓ · Fase 0 cerrada y verificada. `npm run verify` en verde. Repo
  privado BigAPP37/Arca con dos commits. Supabase «Arca»
  (ref girbdumarikmcctawmql, eu-west-3) con la migración 20260915201204 aplicada
  y registrada, y el asesor de seguridad sin hallazgos. Vercel sirviendo
  https://arca-eosin.vercel.app con la CSP ya estrechada al origen real.
  Decisiones DEC-0001 a DEC-0005 escritas.

SIGUIENTE PASO · Fase 1: hogar, miembros y el primer movimiento. Empieza por el
  modelo de datos con el agente `datos` —FK compuesta (id, household_id) desde la
  primera tabla— y pasa por `seguridad` antes de dar nada por bueno.

NO HACER · No portar código de las versiones anteriores: solo viajan las
  lecciones de 03_LECCIONES.md. No meter la importación de extractos antes de la
  fase 5 (DEC-0005). No aplicar migraciones desde el editor SQL del panel. No
  suponer que un push despliega: hasta que GitHub esté conectado a Vercel, el
  despliegue es manual.
```
