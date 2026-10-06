/**
 * i18n coverage checker: compares keys in each language block against en.
 * Run with: node scripts/check-i18n-coverage.cjs
 */
const fs = require('fs');
const path = require('path');
const tsCompiler = require('typescript');

const file = path.join(__dirname, '..', 'src', 'lib', 'i18n', 'translations.ts');
const ts = fs.readFileSync(file, 'utf8');

const sourceFile = tsCompiler.createSourceFile(
  file,
  ts,
  tsCompiler.ScriptTarget.Latest,
  true,
  tsCompiler.ScriptKind.TS
);

/** Collect keys from a language object literal. */
function extractKeys(objLiteral) {
  const keys = new Set();
  for (const prop of objLiteral.properties) {
    if (tsCompiler.isPropertyAssignment(prop) || tsCompiler.isShorthandPropertyAssignment(prop)) {
      const name = prop.name;
      if (tsCompiler.isIdentifier(name) || tsCompiler.isStringLiteral(name)) {
        keys.add(name.text);
      }
    }
  }
  return keys;
}

let enKeys = null;
const report = [];

sourceFile.forEachChild((node) => {
  if (!tsCompiler.isVariableStatement(node)) return;
  for (const decl of node.declarationList.declarations) {
    if (decl.name.getText() !== 'translations') continue;
    const obj = decl.initializer;
    if (!obj || !tsCompiler.isObjectLiteralExpression(obj)) continue;
    for (const prop of obj.properties) {
      if (!tsCompiler.isPropertyAssignment(prop)) continue;
      const lang = prop.name.getText();
      const keys = extractKeys(prop.initializer);
      report.push({ lang, count: keys.size });
      if (lang === 'en') {
        enKeys = keys;
      } else if (enKeys) {
        const missing = [...enKeys].filter((k) => !keys.has(k));
        const extra = [...keys].filter((k) => !enKeys.has(k));
        report.push({ lang: lang + ' missing', list: missing });
        report.push({ lang: lang + ' extra', list: extra });
      }
    }
  }
});

let hasMissing = false;
for (const entry of report) {
  if (entry.list) {
    if (entry.list.length > 0) {
      hasMissing = true;
      console.log(`${entry.lang} (${entry.list.length}): ${entry.list.join(', ')}`);
    }
  } else {
    console.log(`${entry.lang}: ${entry.count} keys`);
  }
}
process.exit(hasMissing ? 1 : 0);
