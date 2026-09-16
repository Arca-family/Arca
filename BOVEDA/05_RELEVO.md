# Relevo

Actualizado: 2026-09-16

```
EN QUÉ SE ESTABA · Fase 1 de Arca: «apuntar y ver».

DÓNDE QUEDÓ · Modelo de datos terminado, aplicado al proyecto real y verificado.
  Cinco migraciones nuevas (hogar, miembros, catálogo, movimientos, vistas), con
  md5 idéntico entre fichero local y registro remoto. La prueba de aislamiento
  `supabase/tests/aislamiento_fase_1.sql` pasa 11 de 11 con datos reales y se
  deshace sola. La auditoría cazó dos agujeros antes de aplicar y están
  corregidos. La base queda vacía: 0 usuarios, 0 movimientos, 21 categorías.

SIGUIENTE PASO · La interfaz de la fase 1: los tres clientes de Supabase, alta de
  hogar, entrada rápida de un movimiento en tres toques, y la pantalla de inicio
  leyendo `household_monthly_totals`. Ninguna pantalla suma movimientos por su
  cuenta.

NO HACER · No revocar el `execute` de las cuatro funciones públicas de la
  frontera para callar el aviso del asesor: son el único camino de escritura y
  validan la pertenencia a mano. No conceder privilegios de escritura directa
  sobre `transactions`. No aplicar migraciones desde el editor SQL del panel. La
  clave de idempotencia la genera el dispositivo, aleatoria por intento: si se
  derivara de los datos del formulario, dos personas que apunten la misma compra
  chocarían con un PT409.
```
