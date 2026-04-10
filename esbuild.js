const { build } = require('esbuild')
const watch = process.argv.includes('--watch')

build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  watch: watch ? { onRebuild(err) { console.log(err ?? 'rebuilt') } } : false,
}).catch(() => process.exit(1))
