# Relevo

Actualizado: 2026-09-16

```
EN QUÉ SE ESTABA · Fase 1 de Arca: «apuntar y ver», ya conectada a Supabase.

DÓNDE QUEDÓ · El circuito completo funciona y está probado a mano de punta a
  punta en local: entrar con correo y contraseña → crear hogar → apuntar un gasto
  → verlo en inicio y en movimientos → filtrar por tipo → anular y deshacer. El
  importe llega a la base exacto (12.34, sin residuo de coma flotante) y la clave
  de idempotencia es un uuid por intento. Los datos de la prueba se borraron: la
  base vuelve a tener 0 usuarios y 0 movimientos, solo las 21 categorías.

SIGUIENTE PASO · Que una segunda persona pueda unirse a un hogar existente. Hoy
  no hay manera: `create_household` siempre crea uno nuevo y no existe RPC de
  invitación. Hay que decidir el flujo (código de invitación, enlace o correo) y,
  de paso, cerrar que `household_members` concede `insert` directo a un adulto,
  que es la única escritura del cliente que no pasa por la frontera.

NO HACER · No borrar al único adulto de un hogar: la guarda
  `household_members_require_active_adult` lo impide y hace falta ser dueño de la
  base para saltársela. No derivar la clave de idempotencia de los datos del
  formulario. No sumar movimientos en una pantalla: el total sale de
  `household_monthly_totals`. Y no meter datos reales de la familia en el
  repositorio, que ahora es público.
```
