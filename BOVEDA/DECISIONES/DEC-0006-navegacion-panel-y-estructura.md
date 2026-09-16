# DEC-0006 · Dos pantallas raíz: el panel y la estructura

Fecha: 2026-09-16 · Estado: aceptada

## Contexto

Arca tiene que sostener con el tiempo gastos, ingresos, presupuesto, cuentas,
deudas, ahorro y objetivos. Si la navegación se diseña solo para lo que existe en
la fase 1, hay que rehacerla en cada fase, y rehacer navegación es lo que dejó a
la versión anterior con dos generaciones de componentes conviviendo.

Había además dos ideas distintas metidas en la misma frase: una pantalla para
**consultar** cómo va el hogar, y una pantalla para **definir** su esqueleto
(qué cuentas, qué deudas, qué objetivos, quién es quién). Son cosas distintas y
mezclarlas produce un panel que se edita sin querer.

## Decisión

Dos pantallas raíz, separadas:

- **Inicio**, el panel del día a día: la cifra del mes arriba y un bloque por
  área con su número. Solo se consulta.
- **Estructura**, donde se monta y se cambia el esqueleto del hogar: miembros,
  cuentas, deudas, objetivos, categorías. Solo se configura.

Las áreas que aún no existen **se pintan apagadas desde el primer día**, con su
nombre. La navegación se diseña una vez.

**Apuntar un movimiento no cuelga de ninguna de las dos**: es un botón
persistente. La promesa del producto son tres toques, y hacer pasar el alta por
una pantalla intermedia la convierte en cuatro.

Ahorro y objetivos **no entran en el roadmap todavía**: solo ocupan su hueco en
la navegación.

## Por qué

- Un bloque apagado cuesta una línea; rediseñar la navegación en la fase 3
  cuesta una reescritura y un montón de componentes zombis.
- Separar consulta de configuración evita el accidente clásico de cambiar la
  estructura del hogar mientras se mira cómo va el mes.
- Enseñar los huecos también dice a quién usa Arca de qué va a ser capaz, sin
  prometer fechas.

## Alternativas descartadas

- **Una sola pantalla-centro que lo haga todo** — descartada: mezcla consulta y
  configuración, y obliga a pasar por ella para cualquier cosa.
- **Menú como centro de navegación** — descartada: añade un salto a todo, y lo
  primero que rompe es la promesa de los tres toques.
- **Enseñar solo lo construido** — descartada: es exactamente lo que obliga a
  rediseñar la navegación en cada fase.

## Consecuencias

- La barra inferior nace con sus tres destinos definitivos: Inicio, Movimientos
  y Estructura, más el botón de apuntar. No cambia al añadir fases.
- Cada fase nueva **enciende** su bloque; no añade navegación.
- Una pantalla de consulta nunca escribe. Si algo se edita desde Inicio, está
  mal colocado.
