# Producto

Actualizado: 2026-09-15

## Qué es Arca

El fondo común del hogar. Una aplicación privada para que las personas que
viven juntas lleven el dinero compartido desde sus móviles: qué entra, qué sale,
cuánto queda y cuánto se debe.

## La promesa

**Sencillez, rapidez y volver mañana.** En ese orden.

- Apuntar un gasto cuesta **tres segundos y tres toques**.
- Abrir la app responde de un vistazo a **«¿cómo vamos este mes?»**.
- No se premia con gráficas: se premia con la sensación de tener el mes
  controlado.

Cualquier función que no sirva a esas tres cosas se discute antes de
construirse. La versión anterior del proyecto murió de exceso de alcance.

## Quién lo usa

El caso base son **dos adultos** que comparten gastos. El modelo debe admitir
sin rediseño, pero **sin construirlo antes de que haga falta**:

| Perfil | Qué necesita |
|---|---|
| Dos adultos (caso base) | Todo, a partes iguales |
| Compañeros de piso | Lo mismo, pero con gastos propios separados de los comunes |
| Hijo mayor de edad que ayuda | Puede apuntar y consultar, no reconfigura |
| Menor en modo aprendizaje | Ve lo suyo, aprende, no toca lo común |

Consecuencia técnica: **roles desde el principio, pero los mínimos**. No se
inventan permisos que nadie ha pedido.

## Los cuatro pilares

En este orden de prioridad, decidido con el usuario el 2026-09-15:

1. **Gastos del día a día** — apuntar rápido y ver en qué se va el mes.
2. **Presupuesto por categorías** — un límite mensual y cuánto queda de cada
   sobre.
3. **Cuentas y saldos** — corriente, ahorro, efectivo, tarjeta, y movimientos
   entre ellas sin contarlos dos veces.
4. **Deudas y préstamos** — capital, intereses, cuánto falta y cuándo acaba.

## Supuestos fijados

España · EUR · `Europe/Madrid` · interfaz en español.

## Fuera de alcance por ahora

No es «nunca»: es «no hasta que los cuatro pilares estén sólidos».

- **Conexión automática con el banco.** Requiere un proveedor de agregación
  autorizado (PSD2), con contrato y coste recurrente; no es solo trabajo. Ver
  `04_ROADMAP.md`, fase 6.
- Notificaciones push y correo.
- Informes PDF y cierre mensual auditado.
- Multi-hogar como producto comercial para terceros.

## Métricas de éxito

La versión anterior nunca las definió y por eso nunca se supo si iba bien.
Propuesta a validar:

- **Tiempo de alta de un gasto:** por debajo de 5 segundos desde abrir la app.
- **Retención semana 4:** los dos adultos siguen apuntando al mes de empezar.
- **Cobertura del mes:** porcentaje de gastos reales que acaban apuntados.
- **Cero desajustes:** ninguna cifra de la app contradice a otra cifra de la app.
