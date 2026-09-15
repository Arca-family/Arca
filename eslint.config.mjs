import { globalIgnores } from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';

// `eslint-config-next/core-web-vitals` ya trae dentro `next/typescript`: no hace
// falta extenderlo aparte, y no se usa FlatCompat porque la versión 16 del
// paquete exporta configuración plana directamente.
const eslintConfig = [
  ...next,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
];

export default eslintConfig;
