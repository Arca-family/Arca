# DEC-0005 · La importación de extractos entra en la fase 5, no en el v1

Fecha: 2026-09-15 · Estado: aceptada

## Contexto

Al definir el alcance, la preferencia inicial fue meter la importación de
extractos CSV/XLSX **en el v1**, como paso intermedio hacia el objetivo real:
conectar Arca directamente con el banco.

Al recuperar el conocimiento de las versiones anteriores apareció la evidencia
en contra (lección L15): el importador fue, con diferencia, la pieza más frágil
del proyecto. Soportaba Unicaja, CaixaBank y formatos antiguos; se llevó los
últimos commits antes de que el proyecto muriera (filas de ingreso omitidas,
duplicados en la previsualización, recuentos que no acumulaban) y necesitó dos
migraciones dedicadas solo a **reparar lotes ya confirmados**.

## Decisión

La importación entra en la **fase 5**, después de que los cuatro pilares estén
cerrados. El v1 se apunta a mano.

## Por qué

Un importador que escribe en un libro contable que todavía está cambiando de
forma es un multiplicador de errores: cada cambio del modelo obliga a rehacer la
conciliación, y cada fallo de conciliación contamina datos reales de dinero. Con
los cuatro pilares cerrados, el importador tiene un blanco quieto al que apuntar.

## Alternativas descartadas

- **Importación en el v1** — descartado con la evidencia de L15 delante.
- **No hacer importación nunca** — descartado: es el camino natural hacia la
  conexión bancaria, que es el objetivo declarado del producto.

## Consecuencias

- El v1 tiene que hacer la entrada manual **muy buena**: tres segundos, tres
  toques. Si apuntar a mano duele, la gente deja de usar Arca antes de llegar a
  la fase 5.
- El modelo de datos se diseña desde el principio pensando en que algún día
  llegarán movimientos de fuera: origen del movimiento, huella para detectar
  duplicados y resultado terminal único por fila importada (L9).
- Cuando llegue, nace aislada y con vía de reparación de lotes confirmados.
