import path from 'path'
import esbuild from 'esbuild'
import globby from 'globby'

const rootPath = path.resolve(__dirname, '..')

const define = {
  'process.env.NODE_ENV': JSON.stringify('production'),
}

async function _findEntryPoints() {
  const files = await globby([path.resolve(rootPath, 'src/**/*.ts')])

  return files.filter((file) => {
    return !file.includes('__fixtures__') && !file.endsWith('.test.ts')
  })
}

function _buildCjs(entryPoints: string[]) {
  return esbuild.build({
    format: 'cjs',
    target: 'es2015',
    define,
    bundle: true,
    outdir: path.resolve(rootPath, 'lib/cjs'),
    sourcemap: 'external',
    entryPoints,
  })
}

function _buildEs(entryPoints: string[]) {
  return esbuild.build({
    format: 'esm',
    target: 'es2015',
    define,
    bundle: true,
    outdir: path.resolve(rootPath, 'lib/esm'),
    sourcemap: 'external',
    entryPoints,
  })
}

async function _build() {
  const entryPoints = await _findEntryPoints()

  return Promise.all([_buildCjs(entryPoints), _buildEs(entryPoints)])
}

_build().catch((err) => {
  console.error(err)
  process.exit(1)
})
