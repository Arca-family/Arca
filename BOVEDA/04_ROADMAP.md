# Roadmap

Actualizado: 2026-09-15

Orden pensado como lo pensaría un equipo de producto: cada fase **se cierra
entera** —usable en el móvil, probada y desplegada— antes de abrir la siguiente.
La lección L0 dice que el alcance mata antes que los bugs.

## Antes de la fase 0 · decisiones abiertas

| Decisión | Estado |
|---|---|
| Framework y forma de la app | **Cerrada** el 2026-09-15 · DEC-0004 |
| Cuándo entra la importación de extractos | **Cerrada** el 2026-09-15 · DEC-0005: fase 5 |
| Repositorio `BigAPP37/Arca` en GitHub | **Hecho** |
| Proyecto de Supabase y de Vercel | **Hecho** |
| Fila de Arca en `~/.codex/AGENTS.md` | **Hecha** |

## Fase 0 · Cimientos  ✔ cerrada el 2026-09-15

Esqueleto del proyecto, entorno y despliegue vacío funcionando de punta a punta.

Comprobado: `npm run verify` en verde en local **y el CI de GitHub en verde**
(43 s), primera migración registrada en el proyecto remoto, auditoría de
seguridad de Supabase sin hallazgos, y https://arca-eosin.vercel.app respondiendo
200 con las cabeceras puestas y la CSP estrechada al origen real.

Queda solo lo que depende de ti: conectar GitHub a Vercel para que despliegue en
cada push (ver `02_ESTADO_Y_ARQUITECTURA.md`).

**Hecho cuando:** `npm run` de lint, tipos, pruebas y build pasa en local y en
CI; el proyecto de Supabase existe con una primera migración aplicada por CLI;
Vercel sirve una página en blanco con las cabeceras de seguridad puestas; y
entrar en la carpeta carga la cuenta `personal` sola.

## Fase 1 · Apuntar y ver  ← siguiente, y el corazón del producto

Hogar, miembros, un movimiento (ingreso o gasto) con categoría, y la pantalla de
inicio que responde «¿cómo vamos este mes?».

**Hecho cuando:** dos personas distintas, en dos móviles distintos, apuntan un
gasto en menos de 5 segundos y los dos ven la misma cifra; ningún hogar ve datos
de otro (comprobado con una prueba, no de vista); y las cuatro identidades
contables de L8 tienen su test.

## Fase 2 · Presupuesto por categorías

Límite mensual por categoría, cuánto queda, y plantilla del mes siguiente.

**Hecho cuando:** el sobre se deduce de categoría y mes sin pedir nada al
usuario (L7), y cambiar la categoría o la fecha de un movimiento recalcula los
sobres afectados.

## Fase 3 · Cuentas y saldos

Corriente, ahorro, efectivo, tarjeta. Transferencias entre cuentas propias.

**Hecho cuando:** mover dinero entre dos cuentas propias **no** aparece como
gasto en ningún sitio, y el saldo de cada cuenta cuadra con sus movimientos.

## Fase 4 · Deudas y préstamos

Capital, intereses, aportaciones, cuánto falta y cuándo acaba.

**Hecho cuando:** una cuenta de préstamo solo se mueve mediante un pago de deuda
validado (L10), y el disponible del hogar nunca se mezcla con la deuda (L8).

## Fase 5 · Importación de extractos

Decidido el 2026-09-15 (DEC-0005): entra **aquí**, con el libro ya sólido
detrás, y no en el v1. El motivo está en la lección L15: fue la pieza más frágil
de las dos versiones anteriores y se llevó los últimos commits del proyecto.

**Hecho cuando:** los ficheros se procesan en el dispositivo y no se suben; cada
fila tiene un único resultado terminal (L9); y existe la vía de reparación de
lotes ya confirmados desde el primer día.

## Fase 6 · Conexión con el banco

El objetivo declarado del usuario. **No es solo trabajo:** leer cuentas bancarias
en España exige un proveedor de agregación autorizado bajo PSD2, con contrato,
verificación y coste recurrente, además del consentimiento renovable del
titular. Antes de prometer nada aquí hay que comparar proveedores y precios con
datos actuales.

**Hecho cuando:** hay un proveedor elegido con su coste escrito, y la conexión
convive con la entrada manual sin duplicar ningún movimiento.
