# CLAUDE.md — AnesthOS Clinical Development Standards

## 1. Project Overview & Architecture
AnesthOS-app is a high-reliability clinical anesthesia application.
- **Framework**: Vite + React 18 + TypeScript + Tailwind CSS
- **Testing**: Vitest with `@vitest/coverage-v8` (Minimum 60% coverage floor across statements, branches, functions, lines)
- **Architecture Core**: Pure domain engine (`src/domain/`) strictly isolated from UI (`src/ui/`).

---

## 2. Clinical Safety Standards (Tier CLINICAL)

### BS-B: Fail-Loud Safety Guardrail
- **Rule**: Never swallow errors, return `0`, `null`, `undefined`, or clipped default values when inputs are out of bounds or invalid.
- **Requirement**: Throw explicit, typed domain exceptions (`ClinicalValidationError`).
- **Pattern**:
  ```ts
  export class ClinicalValidationError extends Error {
    constructor(public code: string, message: string) {
      super(`[CLINICAL ERROR: ${code}] ${message}`);
      this.name = 'ClinicalValidationError';
    }
  }
  ```

### BS-C: Provenance Metadata Requirement (Source + Version)
- **Rule**: Every clinical calculator, guideline specification, or reference dataset MUST export associated provenance metadata (`ClinicalProvenance`).
- **Interface Definition**:
  ```ts
  export interface ClinicalProvenance {
    guidelineName: string;
    issuingOrganization: string;
    versionOrYear: string;
    citationDOIorPMID?: string;
    lastReviewedDate: string;
  }
  ```

### BS-F: Zero-Network & Pure Offline Execution
- **Rule**: `src/domain/` MUST be 100% pure, deterministic, and offline.
- **Forbidden in `src/domain/`**:
  - Network APIs (`fetch`, `axios`, `XMLHttpRequest`, `WebSocket`)
  - Non-deterministic APIs (`Math.random()`, `Date.now()`, `new Date()`)
  - Platform/UI dependencies (`window`, `document`, `localStorage`, React hooks, JSX)
  - Direct UI component imports (`src/ui/*`)

---

## 3. Key Commands & Workflows
- **Install Dependencies**: `npm install`
- **Development Server**: `npm run dev`
- **Production Build**: `npm run build` (Runs `tsc -b` and Vite build)
- **Run Unit Tests**: `npm run test`
- **Run Coverage Check**: `npm run test:coverage` (Enforces >=60% floor)
- **Run Import Boundary Lint**: `npm run lint:boundary`
- **Run Secret Scan**: `npm run secret-scan`
