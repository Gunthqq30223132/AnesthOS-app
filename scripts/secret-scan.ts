import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

interface PatternRule {
  name: string;
  pattern: RegExp;
}

const SECRET_PATTERNS: PatternRule[] = [
  { name: 'OpenAI/Stripe Secret Key', pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: 'GitHub Personal Access Token', pattern: /ghp_[A-Za-z0-9]{36}/ },
  { name: 'GitHub Fine-Grained Token', pattern: /github_pat_[A-Za-z0-9_]{80,}/ },
  { name: 'AWS Access Key ID', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key Header', pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH|PRIVATE)\s+KEY-----/ },
  { name: 'Private Certificate Header', pattern: /-----BEGIN CERTIFICATE-----/ },
];

const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'coverage'];
const IGNORED_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz'];

const files = globSync('**/*', {
  ignore: IGNORED_DIRS.map((dir) => `${dir}/**`),
  nodir: true,
  dot: true,
});

let violations: string[] = [];

for (const filePath of files) {
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTS.includes(ext)) continue;
  if (filePath === 'scripts/secret-scan.ts') continue;

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const lines = content.split('\n');
  lines.forEach((lineText, idx) => {
    if (lineText.includes('secret-scan-ignore') || lineText.includes('MOCK_SECRET_TEST')) {
      return;
    }

    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(lineText)) {
        violations.push(`[Secret Scan Risk] ${filePath}:${idx + 1} -> Potential ${name}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error('\n❌ Secret Scan Failed! Potential hardcoded secrets found:');
  violations.forEach((v) => console.error(`  - ${v}`));
  process.exit(1);
} else {
  console.log('✅ Secret Scan Passed: 0 secret violations found across project files.');
}
