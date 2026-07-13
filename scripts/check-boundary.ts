import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { globSync } from 'glob';

interface Violation {
  file: string;
  line: number;
  message: string;
}

const violations: Violation[] = [];

function checkFile(filePath: string) {
  const relativePath = path.relative(process.cwd(), filePath);

  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    violations.push({
      file: relativePath,
      line: 1,
      message: 'Forbidden file extension (.tsx/.jsx) in pure domain layer.',
    });
    return;
  }

  const code = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  function visit(node: ts.Node) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    // 1. Check Import Declarations
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      const lower = moduleSpecifier.toLowerCase();
      if (
        lower === 'react' ||
        lower === 'react-dom' ||
        lower.includes('react/') ||
        lower.includes('axios') ||
        lower.includes('/ui') ||
        lower.startsWith('@/ui')
      ) {
        violations.push({
          file: relativePath,
          line: line + 1,
          message: `Forbidden import '${moduleSpecifier}' in domain logic.`,
        });
      }
    }

    // 2. Check Call Expressions (Date.now(), Math.random(), fetch(), axios())
    if (ts.isCallExpression(node)) {
      const expressionText = node.expression.getText(sourceFile);
      if (
        expressionText === 'Date.now' ||
        expressionText === 'Math.random' ||
        expressionText === 'fetch' ||
        expressionText === 'window.fetch' ||
        expressionText === 'globalThis.fetch' ||
        expressionText.startsWith('axios')
      ) {
        violations.push({
          file: relativePath,
          line: line + 1,
          message: `Forbidden call '${expressionText}()' in domain logic. Domain must be pure and deterministic.`,
        });
      }
    }

    // 3. Check New Expressions (new Date() with 0 args)
    if (ts.isNewExpression(node)) {
      const expressionText = node.expression.getText(sourceFile);
      if (expressionText === 'Date' && (!node.arguments || node.arguments.length === 0)) {
        violations.push({
          file: relativePath,
          line: line + 1,
          message: `Forbidden non-deterministic 'new Date()' instantiation (0 args). Pass timestamp parameter instead.`,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const domainFiles = globSync('src/domain/**/*.{ts,tsx,js,jsx}', { absolute: true });

for (const file of domainFiles) {
  checkFile(file);
}

if (violations.length > 0) {
  console.error('\n❌ Domain Import & Safety Boundary Violations Found:');
  violations.forEach((v) => console.error(`  ${v.file}:${v.line} -> ${v.message}`));
  process.exit(1);
} else {
  console.log('✅ Domain Boundary Validation Passed: src/domain is pure, deterministic, and isolated.');
}
