import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Domain Boundary Guardrail Execution', () => {
  it('passes boundary check script for clean domain code', () => {
    const projectRoot = path.resolve(__dirname, '..');
    expect(() => {
      execSync('npx tsx scripts/check-boundary.ts', { cwd: projectRoot, stdio: 'pipe' });
    }).not.toThrow();
  });
});
