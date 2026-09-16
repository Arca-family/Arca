#!/usr/bin/env node
// Un agente se escribe una vez en .claude/agents/*.md y este script lo traduce
// a .codex/agents/*.toml. La fuente de verdad es SIEMPRE el .md: es lo único
// que se versiona (.codex/agents/ está en .gitignore) y lo que evita que las
// dos copias se contradigan.
//
// Ojo: generar el .toml no basta para que Codex lo use. Codex solo carga
// agentes registrados en config.toml ([agents.<nombre>].config_file); de eso se
// encarga scripts/agentes/codex.mjs, que los pasa con -c al arrancar.
//
//   node scripts/agentes/sync.mjs            -> regenera .codex/agents/
//   node scripts/agentes/sync.mjs --check    -> falla si algún .toml no está al día
//
// Los dos modos fallan si un agente está mal declarado (sin frontmatter o sin
// description). Esa comprobación es la única que sirve en CI: los .toml están
// fuera de git, así que en un checkout limpio no hay nada con lo que comparar y
// `--check` no puede detectar desfase ahí. Lo que CI valida es que cada agente
// se pueda generar y esté bien declarado.
import { execFileSync } from 'node:child_process';
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

const ORIGEN = path.join(RAIZ, '.claude', 'agents');
const DESTINO = path.join(RAIZ, '.codex', 'agents');
const comprobar = process.argv.includes('--check');

function frontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const campos = {};
  let clave = null;
  for (const linea of m[1].split(/\r?\n/)) {
    const cab = linea.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (cab) { clave = cab[1]; campos[clave] = cab[2].trim(); }
    else if (clave && linea.trim()) campos[clave] += ` ${linea.trim()}`;
  }
  return { campos, cuerpo: m[2].trim() };
}

// Cadena TOML multilínea: hay que escapar la barra invertida y las comillas
// triples, o el fichero deja de parsear.
const tomlTexto = (s) => {
  const limpio = s.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
  return `"""\n${limpio.endsWith('"') ? `${limpio}\n` : limpio}"""`;
};
const tomlLinea = (s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

if (!fs.existsSync(ORIGEN)) {
  console.error(`No hay agentes en ${ORIGEN}`);
  process.exit(1);
}
fs.mkdirSync(DESTINO, { recursive: true });

const fuentes = fs.readdirSync(ORIGEN).filter((f) => f.endsWith('.md'));
const esperados = new Set();
let desfasados = 0;
let malDeclarados = 0;

for (const fichero of fuentes) {
  const crudo = fs.readFileSync(path.join(ORIGEN, fichero), 'utf8');
  const parsed = frontmatter(crudo);
  if (!parsed) {
    console.error(`MAL DECLARADO ${fichero}: sin frontmatter.`);
    malDeclarados += 1;
    continue;
  }
  const { campos, cuerpo } = parsed;
  // En Claude los agentes son del proyecto y no chocan con nada. En Codex el
  // registro es global —lo comparten todos los repos de esta máquina—, así que
  // ahí van con prefijo: `arca-codigo` no se confunde con el de otro proyecto.
  const base = campos.name || path.basename(fichero, '.md');
  const nombre = base.includes('arca') ? base : `arca-${base}`;
  if (!campos.description) {
    console.error(`MAL DECLARADO ${fichero}: sin description; Codex no sabría cuándo usarlo.`);
    malDeclarados += 1;
    continue;
  }

  // Codex no lee `tools:` ni `model:` del frontmatter, así que cada agente
  // lleva sus límites escritos dentro del propio prompt. Si algún día uno se
  // declara con tools solo de lectura, aquí se le añade la cabecera.
  const soloLectura = /^(Read|Grep|Glob)(,\s*(Read|Grep|Glob))*$/.test(campos.tools || '');
  const cabecera = soloLectura
    ? 'Solo lectura: no edites, no escribas y no ejecutes nada que cambie ficheros. Revisas y reportas.\n\n'
    : '';

  const toml = `# Generado por scripts/agentes/sync.mjs desde .claude/agents/${fichero}
# No edites este fichero: edita el .md y vuelve a lanzar el script.
name = ${tomlLinea(nombre)}
description = ${tomlLinea(campos.description || '')}
developer_instructions = ${tomlTexto(cabecera + cuerpo)}
`;

  const salida = path.join(DESTINO, `${nombre}.toml`);
  esperados.add(`${nombre}.toml`);
  const previo = fs.existsSync(salida) ? fs.readFileSync(salida, 'utf8') : null;
  if (previo === toml) continue;
  desfasados += 1;
  if (comprobar) console.error(`DESFASADO: ${path.relative(RAIZ, salida)}`);
  else { fs.writeFileSync(salida, toml); console.log(`ok ${path.relative(RAIZ, salida)}`); }
}

for (const sobra of fs.readdirSync(DESTINO).filter((f) => f.endsWith('.toml') && !esperados.has(f))) {
  desfasados += 1;
  if (comprobar) console.error(`SOBRA (ya no existe su .md): .codex/agents/${sobra}`);
  else { fs.rmSync(path.join(DESTINO, sobra)); console.log(`borrado .codex/agents/${sobra}`); }
}

if (malDeclarados) {
  console.error(`\n${malDeclarados} agente(s) mal declarado(s). Cada .md necesita frontmatter con name y description.`);
  process.exit(1);
}

if (comprobar && desfasados) {
  console.error(`\n${desfasados} fichero(s) fuera de sitio. Arréglalo con: node scripts/agentes/sync.mjs`);
  process.exit(1);
}
console.log(comprobar ? 'Codex está al día con .claude/agents/.' : `${fuentes.length} agentes sincronizados a .codex/agents/.`);
