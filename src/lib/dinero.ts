/**
 * Todo el dinero de Arca pasa por aquí.
 *
 * La regla dura número uno del proyecto es que los importes nunca se calculan en
 * coma flotante: `0.1 + 0.2` no es `0.3`, y en una app de cuentas compartidas
 * eso significa que dos móviles pueden mostrar cifras distintas del mismo mes.
 * Dentro del programa un importe es un **entero de céntimos**; en la base es
 * `numeric(14,2)`. La conversión ocurre solo en los bordes: al leer lo que
 * escribe una persona y al pintarlo en pantalla.
 */

/** Un importe en céntimos. Entero, con signo. */
export type Centimos = number;

// El límite de numeric(14,2) expresado en céntimos. Cabe de sobra en un entero
// de JavaScript (el techo exacto son 9.007.199.254.740.991), así que aquí no
// hace falta BigInt: mientras se rechace todo lo que pase de este máximo, la
// aritmética con enteros es exacta.
const MAXIMO = 999_999_999_999;
const DIGITOS_MAXIMOS = 12;

export class ImporteInvalido extends Error {}

/**
 * Convierte lo que teclea una persona en céntimos.
 *
 * Acepta la forma española (`1.234,56`) y la inglesa (`1234.56`), con o sin
 * símbolo de euro y con espacios sueltos. Rechaza todo lo demás en vez de
 * adivinar: un importe mal interpretado es peor que un error a la cara.
 */
export function aCentimos(entrada: string): Centimos {
  const limpio = entrada.trim().replace(/[€\s ]/g, '');
  if (limpio === '') throw new ImporteInvalido('Importe vacío');

  const signo = limpio.startsWith('-') ? -1 : 1;
  const sinSigno = limpio.replace(/^[+-]/, '');

  // Si hay coma, manda la coma como separador decimal y el punto son miles.
  const normalizado = sinSigno.includes(',')
    ? sinSigno.replace(/\./g, '').replace(',', '.')
    : sinSigno;

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) {
    throw new ImporteInvalido(`Importe no reconocido: ${entrada}`);
  }

  const [enteros, decimales = ''] = normalizado.split('.');
  // Se comprueba la longitud antes de convertir: así nunca se construye un
  // número que haya podido perder precisión por el camino.
  if (enteros.replace(/^0+/, '').length > DIGITOS_MAXIMOS) {
    throw new ImporteInvalido(`Importe demasiado grande: ${entrada}`);
  }

  const centimos = Number(enteros) * 100 + Number(decimales.padEnd(2, '0'));
  if (centimos > MAXIMO) throw new ImporteInvalido(`Importe demasiado grande: ${entrada}`);

  return signo * centimos;
}

/** Pinta céntimos en formato español: 123456 → «1.234,56 €». */
export function formatear(centimos: Centimos, conSimbolo = true): string {
  const formato = new Intl.NumberFormat('es-ES', {
    style: conSimbolo ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    // El español, por norma, escribe los números de cuatro cifras sin punto de
    // millar («1234,56»), y eso es lo que hace Intl por su cuenta. Aquí se
    // fuerza el punto siempre a propósito: en una lista de importes, que unos
    // lleven separador y otros no obliga a leer cada cifra dos veces.
    useGrouping: 'always',
  });
  return formato.format(centimos / 100);
}

/**
 * Lo que se manda a la base: cadena con dos decimales, nunca un número de
 * JavaScript. Postgres la recibe como `numeric(14,2)` sin pasar por un float
 * intermedio.
 */
export function aNumericSql(centimos: Centimos): string {
  const signo = centimos < 0 ? '-' : '';
  const abs = Math.abs(centimos);
  return `${signo}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Lo que devuelve la base (`numeric` llega como cadena) vuelve a céntimos. */
export function desdeNumericSql(valor: string | number): Centimos {
  return aCentimos(typeof valor === 'number' ? valor.toFixed(2) : valor);
}

/** Suma exacta. Existe para que nadie tenga la tentación de usar `reduce` con floats. */
export function sumar(...importes: Centimos[]): Centimos {
  return importes.reduce((total, importe) => total + importe, 0);
}
