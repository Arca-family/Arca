#!/usr/bin/env node
// Arranca Codex con los agentes de Arca ya registrados.
//
// Codex solo carga un agente si está declarado en config.toml como
//   [agents.<nombre>]
//   config_file = "<ruta absoluta al .toml del rol>"
// Dejar los .toml en .codex/agents/ no basta: sin registrar, los ignora.
//
// En vez de escribir eso en ~/.codex/config.toml —que es global y esta máquina
// tiene varios proyectos— se pasa por `-c` en cada arranque: los agentes
// existen solo en las sesiones de Arca y tu config personal se queda igual.
//
//   node scripts/agentes/codex.mjs                -> sesión interactiva
//   node scripts/agentes/codex.mjs --solo-mostrar -> imprime el comando y sale
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const git = (...args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};
const RAIZ = git('rev-parse', '--show-toplevel') || process.cwd();
const DIR = path.join(RAIZ, '.codex', 'agents');
const roles = () => (fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.toml')) : []);

if (!roles().length) {
  console.log('No hay agentes en .codex/agents/, los genero desde .claude/agents/…');
  spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'agentes', 'sync.mjs')], { stdio: 'inherit' });
}

const registros = roles().flatMap((f) => [
  '-c',
  `agents.${path.basename(f, '.toml')}.config_file=${JSON.stringify(path.join(DIR, f))}`,
]);

if (!registros.length) {
  console.error('Sigue sin haber agentes que registrar. Mira: node scripts/agentes/sync.mjs');
  process.exit(1);
}

if (process.argv.includes('--solo-mostrar')) {
  console.log(['codex', ...registros.map((a) => (a === '-c' ? a : `'${a}'`))].join(' '));
  process.exit(0);
}

const resto = process.argv.slice(2);
console.log(`Codex con ${registros.length / 2} agentes de Arca: ${roles().map((f) => path.basename(f, '.toml')).join(', ')}`);
const r = spawnSync('codex', [...registros, ...resto], { stdio: 'inherit' });
process.exit(r.status ?? 1);
