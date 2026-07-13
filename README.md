# AnesthOS-app

AnesthOS is a high-reliability clinical anesthesia application delivering deterministic dosage calculators, clinical practice guidelines, and structured medical data models.

---

## 1. System Architecture: Consumer ↔ Engine Boundaries

AnesthOS is structured around a strict boundary separating the **Clinical Engine** (`src/domain/`) from the **Consumer Layer** (`src/ui/` or autonomous clinical AI agents such as `sr-agent`).

```
+-----------------------------------------------------------------------+
|                       CONSUMER LAYER                                  |
|                                                                       |
|   +-----------------------+           +---------------------------+   |
|   |   React UI Component  |           |   Clinical AI Assistant   |   |
|   |     (src/ui/*)        |           |        (sr-agent)        |   |
|   +-----------+-----------+           +-------------+-------------+   |
|               |                                     |                 |
+---------------|-------------------------------------|-----------------+
                | Consumes via Barrel Exports         |
                v                                     v
+-----------------------------------------------------------------------+
|                        CLINICAL ENGINE                                |
|                        (src/domain/*)                                 |
|                                                                       |
|   +-----------------------+           +---------------------------+   |
|   |  Dosage Calculators   |           |  Static Clinical Datasets |   |
|   | (src/domain/calcula..) |           |    (src/domain/data/*)   |   |
|   +-----------------------+           +---------------------------+   |
|                                                                       |
|   * Zero Dependencies     * 100% Deterministic   * Pure TypeScript    |
|   * Zero Network Calls    * Fail-Loud Errors     * Embedded Provenance|
+-----------------------------------------------------------------------+
```

---

## 2. Boundary Isolation Contracts

### Engine Rules (`src/domain/`)
1. **Framework Agnostic**: Pure TypeScript only. No React, JSX, DOM references, or browser storage APIs.
2. **Zero Network (BS-F)**: Complete offline operation. No HTTP requests (`fetch`/`axios`) or external API calls.
3. **Pure & Deterministic**: Given the same inputs, functions always return identical outputs. No calls to `Date.now()` or `Math.random()`.
4. **Fail-Loud Validation (BS-B)**: Never returns silent defaults or empty fallback values for invalid/out-of-range parameters. Always throws typed domain exceptions (`ClinicalValidationError`).
5. **Clinical Provenance (BS-C)**: All calculation functions and static data sets export attached metadata (`ClinicalProvenance`) specifying issuing body, guideline version, and citation (PMID/DOI).

### Consumer Rules (`src/ui/` & `sr-agent`)
1. **Unidirectional Dependency**: `Consumer` imports from `Engine`. The `Engine` NEVER imports from `Consumer`.
2. **Barrel Exports Only**: Consumers MUST import domain logic exclusively from barrel files (`src/domain/index.ts`, `src/domain/calculators/index.ts`, `src/domain/data/index.ts`). Private internal files cannot be directly imported.
3. **Error Handling Obligation**: Consumers (`UI` or `sr-agent`) MUST catch domain errors (`ClinicalValidationError`) and explicitly display clinical alerts to the user or request corrected parameters. Consumers MUST NOT suppress thrown errors.
4. **Provenance Display**: When displaying clinical calculation results or recommendations, Consumers MUST render the accompanying provenance metadata (guideline source, version, PMID).

---

## 3. Getting Started & Quality Gates

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Development Commands

```bash
# Start Vite development server
npm run dev

# Run TypeScript compiler and production build
npm run build

# Run Vitest unit tests
npm test

# Run Vitest coverage enforcement (>= 60% floor)
npm run test:coverage

# Run domain import boundary validator
npm run lint:boundary

# Run secret scanner
npm run secret-scan
```

### Mandatory CI Gates
Every commit and PR is verified by 5 mandatory gates in `.github/workflows/ci.yml`:
1. `secret-scan`: Prevents secret / credential leakage.
2. `lint:boundary`: Enforces import boundaries (prevents React/UI imports inside `src/domain/`).
3. `build`: Ensures clean TypeScript compilation and Vite bundling.
4. `test`: Runs Vitest unit test suite.
5. `test:coverage`: Enforces minimum 60% statement, line, branch, and function coverage floor.
