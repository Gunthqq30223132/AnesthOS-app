# Comparative Audit: 14-Step External Workflow vs. ADR-0001 Agent-Fleet Architecture

> **Source:** Comparative Audit of 14-Step External AI Development Workflow vs. ADR-0001 Architecture
> **Author:** Antigravity (Orchestrator / Executor) — Proposals for PM Review
> **Date:** 2026-07-21
> **Status:** PROPOSAL — Ready for PM Audit & Review
> **Preflight Anchor:**
> - Repo: `AnesthOS-app`
> - Branch: `claude/adr-0001-agent-fleet`
> - HEAD: `335b5e1255e60db92e6aa71785acdab5f697eb9b`
> - Cwd: `/Users/gun/AnesthOS-app`

---

## 1. Executive Summary

This proposal presents a comprehensive comparative audit between the **14-Step External AI Development Workflow** and the **ADR-0001 Agent-Fleet Coordination Framework** currently governing `AnesthOS-app` and `SR-Agent`.

### Key Findings
1. **Complementary Strengths:** The 14-step external workflow excels in initial visual context harvesting (Design System theft), double-blind cross-model audit synthesis, and downstream deployment automation (VPS / CI/CD loops). ADR-0001 excels in strict machine-enforced governance (Single-Writer Protocol, hash-bound dispatch receipts, worktree isolation, and zero-hand-fixing binary DoD gates).
2. **Core Deficiencies in External Workflow:** The external 14-step process relies heavily on manual human friction (opening chat tabs manually, subjective 80/100 rubric scoring without deterministic gates, and unconstrained prompt context growth).
3. **Proposed Integration:** We synthesize the high-leverage techniques from the 14-step workflow into ADR-0001 without compromising its foundational security invariants (Tier 3 lock down, machine-verified single-writer protocol, and binary gate contracts).

---

## 2. 5-Dimension Deep Dive & Comparison Matrix

| Dimension | 14-Step External Workflow | ADR-0001 Architecture | Comparative Evaluation & Proposal |
|---|---|---|---|
| **1. Context Init & Design Theft** | Browser extension extracts UI/design tokens directly into `CLAUDE.md`. | Strict 5-line Kickoff template (§14A); PM specifies WBS & DoD; Tiered architectural boundaries. | **Adopt with Scoping:** Introduce Design System / Context Harvester pattern for Tier 1 Consumer Apps, scoped strictly within committed Dispatch Envelopes rather than global `CLAUDE.md`. |
| **2. Double-Blind Multi-Model Audit** | Model A (GPT 5.6) audits blindly to `reports/`; Model B (Fable 5) audits codebase independently before reading Model A; synthesized into `LO-TRINH-XXX.md`. | Step 6 PM Audit (Claude auth cloud) + Dispatch receipt verification (§14D) + PubMed clinical verification. | **Adopt for Tier 2/3:** Integrate blind subagent cross-auditing for Tier 2 Clinical / Security code before final PM sign-off to eliminate oracle contamination. |
| **3. Session & Tab Isolation** | Enforces manually opening new chat tabs during error-fixing loops to prevent context degradation. | Machine-enforced `git worktree` isolation (`scripts/new-attempt.sh`), isolated subagents, single-writer single-commit. | **Retain Worktree Base:** `git worktree` isolation is strictly superior to manual tab switching. Subagent context isolation is adopted for long-running attempts. |
| **4. Rubric vs. DoD Gates** | Evaluates PRs using a 100-point rubric across models; sets a passing threshold of 80/100. | Absolute machine-checkable DoD gates (`gates.yml`, zero-hand-fixing check, 100% test pass). | **Synthesize:** Keep binary machine gates as non-negotiable hard prerequisites; add quantitative rubrics for qualitative visual & clinical review. |
| **5. CI/CD & Deployment** | Step 13 (GitHub push + CI/CD build loop) → Step 14 (VPS Deployment). | Step 7 (Visual review → Merge PR → auto-regenerate `handoff.md`). | **Extend Step 7:** Add post-merge deployment automation & staging release verification to ADR-0001 §14B. |

---

### Dimension 1: Context Initialization & Design System Theft (Steps 1–2 vs §14A Kickoff + ADR)

* **External Approach:** In Steps 1–2, external guidelines use Chrome extensions / web scrapers to harvest UI design tokens, component hierarchies, and brand guidelines, embedding them into a root `CLAUDE.md`.
* **ADR-0001 Approach:** ADR-0001 relies on a minimal 5-line Kickoff format (§14A) submitted by the User, after which PM builds formal WBS issues and dispatch envelopes (`.agents/dispatch/<task-id>.md`).
* **Critique & Proposal:** Dumping design scrapes directly into root `CLAUDE.md` violates ADR-0001 §11 (Lesson → Rule) and risks prompt pollution across non-UI tasks.
  * **Proposal:** Adopt the **Design System / Context Harvester Pattern**. When launching Tier 1 Consumer UI tasks, PM or User harvests design tokens (colors, typography, component specs) and pre-commits them into the **Dispatch Envelope** (`.agents/dispatch/<task-id>.md`) under a `## UI Design Tokens` section. This provides Lính (Tier 1 worker model) with rich design context without polluting global repository context.

---

### Dimension 2: Double-Blind Independent Multi-Model Audit (Steps 9–11 vs Step 6 PM Audit)

* **External Approach:** Steps 9–11 generate an independent audit report via Model A (e.g. GPT 5.6 Sol) into `reports/` without letting Model B read it initially. Model B (Fable 5) performs a blind audit of the codebase first, then reads Model A's report, and synthesizes both into an actionable roadmap `LO-TRINH-XXX.md`.
* **ADR-0001 Approach:** Step 6 features a single PM Audit by Claude auth (cloud), verifying anchor tags, DoD items, and clinical constants against PubMed literature.
* **Critique & Proposal:** Single-auditor setups suffer from confirmation bias, especially in Tier 2 Clinical math or Tier 3 Security infrastructure.
  * **Proposal:** Introduce **Double-Blind Multi-Model Review** for Tier 2 Critical code. Before PM performs final approval in Step 6, an independent subagent (running a secondary model tier, e.g. Gemini or GPT via 9router) conducts a blind code inspection and logs findings to `.agents/audits/<task-id>-blind.md`. PM then synthesizes this blind report into the final PR sign-off.

---

### Dimension 3: Session & Tab Isolation (Step 8 vs Antigravity Workspace/Subagent Isolation)

* **External Approach:** Step 8 requires the operator to manually close chat sessions and open fresh chat tabs whenever an error-fixing loop exceeds 2–3 attempts, avoiding context window pollution and hallucination loops.
* **ADR-0001 Approach:** ADR-0001 enforces mechanical isolation using `git worktree` (`attempt/<task-id>`), single-writer single-commit invariants, and compare-and-swap patch execution.
* **Critique & Proposal:** Manual chat tab switching is fragile, user-dependent, and loses execution state. `git worktree` isolation guarantees that failed attempts never pollute the main working tree.
  * **Proposal:** Retain `git worktree` isolation as the architectural core. Enhance subagent dispatch by enforcing a **Fresh Context Threshold**: if an attempt on `attempt/<task-id>` fails 2 consecutive gate checks, subagents must be re-spawned with a clean context containing only `state.md`, the failure trace, and original capsule spec (preventing prompt history contamination).

---

### Dimension 4: Quantitative Rubric Scoring & Scoring Thresholds (Steps 11–12 vs DoD)

* **External Approach:** Steps 11–12 score candidate solutions on a 100-point rubric across multiple model evaluators, enforcing an 80/100 threshold before deployment approval.
* **ADR-0001 Approach:** ADR-0001 mandates strict, machine-checkable binary gates (`gates.yml`, zero-hand-fixing verifier, 100% test pass, coverage targets).
* **Critique & Proposal:** A score of 85/100 is dangerous if the remaining 15 points represent a critical medical math error or security vulnerability. Binary gates are non-negotiable. However, binary gates cannot assess subjective code elegance, accessibility polish, or UI aesthetic excellence.
  * **Proposal:** Create a **Hybrid Evaluation System**:
    1. **Hard Prerequisites (Binary Gate Contract):** Must achieve 100% PASS on `gates.yml`, secret-scan, zero-hand-fixing verifier, and typecheck.
    2. **Soft Criteria (Quantitative Rubric):** Tier 1 & Tier 2 PRs undergo a 100-point rubric evaluation (Code Quality: 30, Visual/UX: 30, Clinical/Domain Precision: 40). A score of ≥ 85/100 is required for PM approval alongside 100% binary gate success.

---

### Dimension 5: CI/CD & Deployment Pipeline Integration (Steps 13–14 vs Step 7 Merge)

* **External Approach:** Step 13 pushes code to GitHub and executes CI/CD build loops; Step 14 deploys the validated build directly to production VPS / cloud servers.
* **ADR-0001 Approach:** Step 7 ends at PR merge and automatic regeneration of `.agents/handoff.md`.
* **Critique & Proposal:** ADR-0001 stops at merge, leaving deployment as an unscripted manual task.
  * **Proposal:** Extend Step 7 of ADR-0001 §14B into **Step 7 (Merge & Post-Merge CD Pipeline)**. Upon PR merge, GitHub Actions or local deployment runners trigger automated staging release, smoke testing, and VPS health verification, recording deployment provenance in `handoff.md`.

---

## 3. Adopted Techniques & Proposed ADR Diffs

### Proposed Diff 1: ADR-0001 §4 (Routing Table & Design System Context)

```diff
  | Tier | Vùng (instance tự khai) | Tác giả code | Tác giả test | Model đích mặc định | Verified trên kênh | Escalate |
  |---|---|---|---|---|---|---|
  | 3 — Security | `scripts/`, `.agents/`, CI config | **Antigravity duy nhất** | Antigravity | — (cấm Lính) | N/A | PM audit bắt buộc |
  | 2 — Critical (vd lâm sàng `src/domain`) | instance khai | Antigravity hoặc model mạnh đã verify | **Model mạnh ≠ tác giả code**, capsule spec-only, giá trị neo văn liệu | Claude Sonnet 4.5 thinking | ✅ 2026-07-18 | → PM |
- | 1 — Consumer (vd `src/ui`) | instance khai | model pin | model pin | Claude Sonnet 4.5 thinking *(tạm — Haiku chưa có biên bản)* | ✅ 2026-07-18 | → Antigravity |
+ | 1 — Consumer (vd `src/ui`) | instance khai | model pin + Design Harvester | model pin | Claude Sonnet 4.5 thinking *(tạm — Haiku chưa có biên bản)* | ✅ 2026-07-18 | → Antigravity |

+ **Luật Design System Context (bổ sung):** Mọi dispatch cho Tier 1 Consumer App phải bao gồm phần `## UI Design Tokens` trong phong bì `.agents/dispatch/<task-id>.md` được thu thập từ Design Harvester (tokens, typography, glassmorphism specs). Cấm đưa design scrapes thô vào `CLAUDE.md`.
```

### Proposed Diff 2: ADR-0001 §14B Step 6 & Step 7 (Double-Blind Audit & CD Pipeline)

```diff
- | **Step 6** | Audit PR độc lập: đối chiếu Anchor khớp với môi trường thực tế -> rà soát từng mục DoD -> đối chiếu giá trị hằng số lâm sàng Tier 2 với PubMed/văn liệu thực tế. | **PM (Claude auth)** |
- | **Step 7** | Đánh giá trực quan (Tier 1 xem lướt, Tier 2 ký duyệt lâm sàng) -> tiến hành merge PR -> đóng Issue -> hệ thống tự động sinh lại tệp `handoff.md`. | **Chủ** |
+ | **Step 6** | Audit PR độc lập & Double-Blind Synthesis: PM kích hoạt blind audit subagent cho Tier 2/3 code (`.agents/audits/<task-id>-blind.md`) -> đối chiếu Anchor -> rà soát DoD & Rubric (≥85/100) -> đối chiếu PubMed cho Tier 2. | **PM (Claude auth)** |
+ | **Step 7** | Đánh giá trực quan -> Merge PR -> Kích hoạt Post-Merge CD (staging build + VPS deploy check) -> đóng Issue -> hệ thống tự động sinh lại tệp `handoff.md`. | **Chủ / CI-CD** |
```

---

## 4. Rejected Anti-Patterns & Technical Rationales

1. **REJECTED: Pure Prompt-Based Chat Tab Isolation**
   * *Rationale:* Relying on human operators to manually open chat tabs during error loops is unscripted and prone to memory leaks. `git worktree` isolation (`scripts/new-attempt.sh`) provides cryptographic and filesystem guarantees that invalid code cannot leak into `main`.
2. **REJECTED: Replacing Binary Machine Gates with 80/100 Subjective Rubrics**
   * *Rationale:* Subjective model scoring cannot replace deterministic typecheck, secret-scan, unit test coverage, and hash receipt verification. Rubric scoring must strictly remain an additive layer above 100% binary gate compliance.
3. **REJECTED: Unscoped Root `CLAUDE.md` Context Scraping**
   * *Rationale:* Placing raw UI scrapes or multi-page documentation into root `CLAUDE.md` causes context bloating and increases token costs on non-UI tasks. Context must be scoped per task inside committed dispatch envelopes.
4. **REJECTED: Direct Lính Commits to Tier 3 Files**
   * *Rationale:* Allowing worker models to directly touch `.agents/`, `scripts/`, or `gates.yml` breaks security invariants (§9) and increases supply-chain vulnerabilities.

---

## 5. Synthesized 7-Step Workflow Upgrades

Below is the updated 7-Step Operational Workflow integrating the best practices of both frameworks:

| Step | Operation Description | Role / Executor | Governance Invariants |
| :--- | :--- | :--- | :--- |
| **Step 1** | Submit 5-line Kickoff request. For Tier 1 UI tasks, attach harvested design tokens. | **Chủ (User)** | No solution dictation; exact 5-line format. |
| **Step 2** | Create GitHub Issue + DoD + Scoped Dispatch Envelope (`.agents/dispatch/<task-id>.md`) containing design tokens & spec capsule. | **PM (Claude auth)** | File committed before dispatch; `Capsule-SHA256` computed post-commit. |
| **Step 3** | Execute dispatch via `dispatch-runner.py` or opencode; commit Lính patch to `attempt/<task-id>` worktree. Generate `dispatch.jsonl` receipt. | **Chủ / Runner** | No manual code edits; receipt hash-bound to patch SHA256. |
| **Step 4** | Notify Orchestrator: *"attempt/<task-id> ready for QC"*. | **Chủ (User)** | Zero patch content in chat windows. |
| **Step 5** | Pre-flight validation (`git apply --check`, path-guard, secret-scan, typecheck) -> Run `gates.yml` on snapshot -> Validate zero-hand-fixing & receipt -> Open PR with trace. | **Antigravity** | Single-writer duy nhất; 100% binary pass required. Escalation triggered if 2 failures occur. |
| **Step 6** | Double-Blind Audit & PM Sign-off: Run secondary blind subagent audit for Tier 2/3 -> Verify anchor, DoD, PubMed constants, and Rubric (≥85/100). | **PM (Claude auth)** | Double-blind multi-model review for Tier 2/3; PM audit mandatory. |
| **Step 7** | Visual approval & Clinical signature -> Merge PR -> Trigger Post-Merge CD (Build & VPS deployment check) -> Regenerate `handoff.md`. | **Chủ / CI-CD** | Post-merge deployment verification; zero truncation in `handoff.md`. |

---

*This proposal file is complete and submitted under `.agents/proposals/workflow-enhancements-14steps.md` for PM review.*
