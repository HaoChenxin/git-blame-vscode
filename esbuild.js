const esbuild = require('esbuild')
const watch = process.argv.includes('--watch')

// ----------------------------------------------------------------
// 构建配置 -- 单一真相源
// ----------------------------------------------------------------
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
}

async function main() {
  if (watch) {
    // esbuild >= 0.17: watch 模式必须走 context().watch()
    const ctx = await esbuild.context(buildOptions)
    await ctx.watch()
    console.log('watching...')
  } else {
    await esbuild.build(buildOptions)
  }
}

main().catch(() => process.exit(1))
