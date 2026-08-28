import { readFileSync, writeFileSync } from 'node:fs'

const pkgPath = 'package.json'
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

for (const [name, path] of Object.entries(pkg.bin as Record<string, string>)) {
  // Skip already-rewritten paths: this script is not idempotent by regex
  // alone (.ts -> .d.ts accumulates a .d per run), and package.json with
  // publish paths must never be committed — only `postpublish` restores it.
  if (!path.startsWith('./src/')) continue
  pkg.bin[name] = path.replace(/^\.\/src\//, 'dist/src/').replace(/\.ts$/, '.js')
}

for (const [key, value] of Object.entries(pkg.exports as Record<string, unknown>)) {
  if (typeof value === 'object' && value !== null) {
    const entry = value as Record<string, string>
    if (entry.types && entry.types.startsWith('./src/')) {
      entry.types = entry.types.replace(/^\.\/src\//, './dist/src/').replace(/\.ts$/, '.d.ts')
    }
    if (entry.default && entry.default.startsWith('./src/')) {
      entry.default = entry.default.replace(/^\.\/src\//, './dist/src/').replace(/\.ts$/, '.js')
    }
  }
}

for (const conditionObj of Object.values(pkg.typesVersions as Record<string, Record<string, string[]>>)) {
  for (const [entryName, paths] of Object.entries(conditionObj)) {
    conditionObj[entryName] = paths.map((p) =>
      p.startsWith('./src/') ? p.replace(/^\.\/src\//, './dist/src/').replace(/\.ts$/, '.d.ts') : p,
    )
  }
}

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
console.log('Rewrote bin, exports, and typesVersions paths for publish')
