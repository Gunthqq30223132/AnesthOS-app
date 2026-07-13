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

function isForbiddenModuleSpecifier(moduleSpecifier: string): boolean {
  const lower = moduleSpecifier.toLowerCase();
  return (
    lower === 'react' ||
    lower === 'react-dom' ||
    lower.includes('react/') ||
    lower.includes('axios') ||
    lower.includes('/ui') ||
    lower.startsWith('@/ui')
  );
}

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

    // 1. Check Import Declarations (static import ... from '...')
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleSpecifier = node.moduleSpecifier.text;
        if (isForbiddenModuleSpecifier(moduleSpecifier)) {
          violations.push({
            file: relativePath,
            line: line + 1,
            message: `Forbidden import '${moduleSpecifier}' in domain logic.`,
          });
        }
      }
    }

    // 2. Check Export Declarations (export ... from '...')
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleSpecifier = node.moduleSpecifier.text;
        if (isForbiddenModuleSpecifier(moduleSpecifier)) {
          violations.push({
            file: relativePath,
            line: line + 1,
            message: `Forbidden export from '${moduleSpecifier}' in domain logic.`,
          });
        }
      }
    }

    // 3. Check Call Expressions (Date.now(), Math.random(), fetch(), axios(), dynamic import(), require())
    if (ts.isCallExpression(node)) {
      // Dynamic import check: import('...')
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          const moduleSpecifier = arg.text;
          if (isForbiddenModuleSpecifier(moduleSpecifier)) {
            violations.push({
              file: relativePath,
              line: line + 1,
              message: `Forbidden import '${moduleSpecifier}' in domain logic.`,
            });
          }
        }
      }

      // require check: require('...')
      if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          const moduleSpecifier = arg.text;
          if (isForbiddenModuleSpecifier(moduleSpecifier)) {
            violations.push({
              file: relativePath,
              line: line + 1,
              message: `Forbidden import '${moduleSpecifier}' in domain logic.`,
            });
          }
        }
      }

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

    // 4. Check New Expressions (new Date() with 0 args)
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
