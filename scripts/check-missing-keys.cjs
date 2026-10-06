/**
 * Finds t('key') usages in components that are missing from the en dictionary.
 * Run with: node scripts/check-missing-keys.cjs
 */
const fs = require('fs');
const path = require('path');
const tsCompiler = require('typescript');

const root = path.join(__dirname, '..');
const dictFile = path.join(root, 'src', 'lib', 'i18n', 'translations.ts');
const source = fs.readFileSync(dictFile, 'utf8');
const sf = tsCompiler.createSourceFile(dictFile, source, tsCompiler.ScriptTarget.Latest, true, tsCompiler.ScriptKind.TS);

let enKeys = new Set();
sf.forEachChild((node) => {
  if (!tsCompiler.isVariableStatement(node)) return;
  for (const decl of node.declarationList.declarations) {
    if (decl.name.getText() !== 'translations') continue;
    const obj = decl.initializer;
    if (!tsCompiler.isObjectLiteralExpression(obj)) return;
    for (const prop of obj.properties) {
      if (!tsCompiler.isPropertyAssignment(prop)) continue;
      if (prop.name.getText() !== 'en') continue;
      for (const p of prop.initializer.properties) {
        if (tsCompiler.isPropertyAssignment(p) || tsCompiler.isShorthandPropertyAssignment(p)) {
          enKeys.add(p.name.getText());
        }
      }
    }
  }
});

// Walk all .tsx files and extract t('...') calls
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.tsx') || (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'))) out.push(full);
  }
  return out;
}

const missing = [];
for (const file of walk(path.join(root, 'src'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\bt\(\s*'([^']+)'\s*\)/g)) {
    const key = m[1];
    if (!enKeys.has(key)) {
      missing.push({ file: path.relative(root, file), key: m[1] });
    }
  }
}

if (missing.length === 0) {
  console.log('All t() keys are present in the en dictionary.');
} else {
  const grouped = {};
  for (const m of missing) {
    (grouped[m.key] ||= []).push(m.file);
  }
  for (const [key, files] of Object.entries(grouped)) {
    console.log(`MISSING: ${key}  <- ${[...new Set(files)].join(', ')}`);
  }
  process.exitCode = 1;
}
