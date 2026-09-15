import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ImporteInvalido,
  aCentimos,
  aNumericSql,
  desdeNumericSql,
  formatear,
  sumar,
} from '../src/lib/dinero';

// Intl separa la cifra del € con un espacio duro (U+00A0), no con uno normal, y
// eso se conserva a propósito: evita que el símbolo salte solo al renglón
// siguiente en una pantalla estrecha. Las pruebas lo escriben explícito para que
// nadie lo "arregle" por error al copiar una cadena.
const DURO = '\u00a0';

test('la coma flotante no toca el dinero', () => {
  // 0.1 + 0.2 !== 0.3 en coma flotante. En céntimos, 10 + 20 === 30 siempre.
  assert.equal(sumar(aCentimos('0,10'), aCentimos('0,20')), 30);
  assert.equal(formatear(sumar(aCentimos('0,10'), aCentimos('0,20'))), `0,30${DURO}€`);
});

test('lee la forma española y la inglesa', () => {
  assert.equal(aCentimos('1.234,56'), 123456);
  assert.equal(aCentimos('1234.56'), 123456);
  assert.equal(aCentimos('14'), 1400);
  assert.equal(aCentimos('14,5'), 1450);
  assert.equal(aCentimos(' 1.234,56 € '), 123456);
  assert.equal(aCentimos('-20,99'), -2099);
});

test('rechaza en vez de adivinar', () => {
  for (const malo of ['', 'catorce', '1,234', '12,345', '1..2', '€', '1,2,3']) {
    assert.throws(() => aCentimos(malo), ImporteInvalido, `debería rechazar: ${malo}`);
  }
});

test('ida y vuelta a la base sin perder un céntimo', () => {
  for (const centimos of [0, 1, 99, 100, 123456, -2099, 999999999999]) {
    assert.equal(desdeNumericSql(aNumericSql(centimos)), centimos);
  }
  assert.equal(aNumericSql(123456), '1234.56');
  assert.equal(aNumericSql(-5), '-0.05');
  assert.equal(aNumericSql(0), '0.00');
});

test('no acepta importes mayores que numeric(14,2)', () => {
  assert.throws(() => aCentimos('10000000000.00'), ImporteInvalido);
});

test('formatea en español', () => {
  assert.equal(formatear(123456), `1.234,56${DURO}€`);
  assert.equal(formatear(0), `0,00${DURO}€`);
  assert.equal(formatear(-2099), `-20,99${DURO}€`);
  assert.equal(formatear(123456, false), '1.234,56');
  // El separador de millar se fuerza siempre, aunque el español admita
  // «1234,56» sin punto: en una lista de importes, la mezcla se lee peor.
  assert.equal(formatear(999999, false), '9.999,99');
});

test('lo que se pinta se puede volver a leer', () => {
  for (const centimos of [0, 5, 1400, 123456, -2099]) {
    assert.equal(aCentimos(formatear(centimos)), centimos);
  }
});
