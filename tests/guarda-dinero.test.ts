import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// Guardia de la regla dura número 1 y de la lección L8: el dinero se formatea y
// se calcula en un único sitio. Una regla escrita en AGENTS.md se ignora; una
// prueba en rojo, no.
//
// Si necesitas una excepción de verdad, añade el fichero a PERMITIDOS y explica
// aquí mismo por qué.
const RAIZ = path.join(import.meta.dirname, '..', 'src');
const PERMITIDOS = new Set([path.join('lib', 'dinero.ts')]);

function ficheros(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    return statSync(completo).isDirectory() ? ficheros(completo) : [completo];
  });
}

const fuentes = ficheros(RAIZ)
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .filter((f) => !PERMITIDOS.has(path.relative(RAIZ, f)));

test('nadie formatea euros a mano fuera de dinero.ts', () => {
  const culpables: string[] = [];
  for (const fichero of fuentes) {
    const texto = readFileSync(fichero, 'utf8');
    texto.split('\n').forEach((linea, i) => {
      if (/toFixed\s*\(/.test(linea) || /['"`]\s*€/.test(linea) || /€\s*['"`]/.test(linea)) {
        culpables.push(`${path.relative(RAIZ, fichero)}:${i + 1}`);
      }
    });
  }
  assert.deepEqual(
    culpables,
    [],
    `Usa formatear() de src/lib/dinero.ts en vez de montar el importe a mano:\n${culpables.join('\n')}`,
  );
});

test('nadie usa parseFloat ni Number() sobre un importe', () => {
  const culpables: string[] = [];
  for (const fichero of fuentes) {
    const texto = readFileSync(fichero, 'utf8');
    texto.split('\n').forEach((linea, i) => {
      if (/(parseFloat|Number)\s*\(\s*\w*(importe|cantidad|precio|saldo|total)/i.test(linea)) {
        culpables.push(`${path.relative(RAIZ, fichero)}:${i + 1}`);
      }
    });
  }
  assert.deepEqual(
    culpables,
    [],
    `Usa aCentimos() de src/lib/dinero.ts:\n${culpables.join('\n')}`,
  );
});
