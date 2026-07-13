import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Domain Boundary Guardrail Execution', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const env = { ...process.env, NODE_V8_COVERAGE: undefined };

  it('passes boundary check script for clean domain code', () => {
    expect(() => {
      execSync('npx tsx scripts/check-boundary.ts', { cwd: projectRoot, stdio: 'pipe', env });
    }).not.toThrow();
  });

  it('detects forbidden static import (React)', () => {
    const tempFile = path.join(projectRoot, 'src/domain/__temp_react_test.ts');
    try {
      fs.writeFileSync(tempFile, "import React from 'react';\nexport const x = 1;");
      expect(() => {
        execSync('npx tsx scripts/check-boundary.ts', { cwd: projectRoot, stdio: 'pipe', env });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it('detects forbidden re-export (export ... from)', () => {
    const tempFile = path.join(projectRoot, 'src/domain/__temp_export_test.ts');
    try {
      fs.writeFileSync(tempFile, "export { App } from '../ui/App';");
      expect(() => {
        execSync('npx tsx scripts/check-boundary.ts', { cwd: projectRoot, stdio: 'pipe', env });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it('detects forbidden dynamic import', () => {
    const tempFile = path.join(projectRoot, 'src/domain/__temp_dynamic_import_test.ts');
    try {
      fs.writeFileSync(tempFile, "export async function load() { return import('axios'); }");
      expect(() => {
        execSync('npx tsx scripts/check-boundary.ts', { cwd: projectRoot, stdio: 'pipe', env });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it('detects forbidden CommonJS require', () => {
    const tempFile = path.join(projectRoot, 'src/domain/__temp_require_test.ts');
    try {
      fs.writeFileSync(tempFile, "const react = require('react');");
      expect(() => {
        execSync('npx tsx scripts/check-boundary.ts', { cwd: projectRoot, stdio: 'pipe', env });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it('detects non-deterministic Date.now() call', () => {
    const tempFile = path.join(projectRoot, 'src/domain/__temp_date_test.ts');
    try {
      fs.writeFileSync(tempFile, 'export const now = Date.now();');
      expect(() => {
        execSync('npx tsx scripts/check-boundary.ts', { cwd: projectRoot, stdio: 'pipe', env });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });
});

