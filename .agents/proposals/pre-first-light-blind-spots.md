# Pre-First-Light Proposals — PM Blind Spot Analysis Response

> **Source:** PM blind spot analysis dated 2026-07-20
> **Author:** Antigravity (executor) — proposals for PM review
> **Status:** PENDING PM REVIEW — do not apply until PM commits

---

## Proposal A — Pin verified model + add `verified_date` column (🔴1)

**Target:** ADR-0001 §4, routing table (line ~53-58)

**Proposed change:** Add a `Verified` column to the tier routing table:

| Tier | Vùng | Tác giả code | Tác giả test | Model đích mặc định | Verified | Escalate |
|---|---|---|---|---|---|---|
| 3 — Security | `scripts/`, `.agents/`, CI config | **Antigravity duy nhất** | Antigravity | — (cấm Lính) | N/A | PM audit bắt buộc |
| 2 — Critical | instance khai | Antigravity hoặc model mạnh | **Model mạnh ≠ tác giả code** | `kiro/claude-sonnet-4.5-thinking` | ✅ 2026-07-18 | → PM |
| 1 — Consumer | instance khai | model pin | model pin | `kiro/claude-sonnet-4.5-thinking` | ✅ 2026-07-18 | → Antigravity |
| 0 — Trivial | instance khai | Gemma 4 local | — | `ollama-local/gemma4:e4b` | ❌ gen-FAIL 2026-07-18 | → Kiro |

**Proposed new rule** (append to §4):
> Route chỉ được trỏ model có biên bản verify (cột Verified = ✅). Model chưa verify chỉ dùng khi có
> fallback rõ ràng lên model đã verify. Haiku chưa có biên bản — First Light pin `claude-sonnet-4.5-thinking`.

---

## Proposal B — Dispatch envelope as committed file (🔴2)

**Target:** ADR-0001 §14 Step 2

**Proposed change:** Before dispatch, PM commits the envelope as a file. Amend Step 2:

> Step 2: PM mở GitHub Issue + DoD. Nếu cần Lính, soạn **Phong bì Dispatch** và **commit nó**
> vào `.agents/dispatch/<task-id>.md` trên branch chính TRƯỚC KHI Chủ dispatch. Format:
>
> ```markdown
> # Dispatch Envelope — <task-id>
> - TASK: <GitHub Issue URL>
> - TARGET: <model-pin, e.g. kiro/claude-sonnet-4.5-thinking>
> - BRANCH: attempt/<task-id>
> - Capsule-SHA256: <12 hex đầu SHA-256 phần capsule bên dưới>
> ---
> <capsule content (spec-only, không code, không secret)>
> ```
>
> Capsule-SHA256 trong file này là **gốc đối chiếu**: khi Chủ paste vào opencode,
> SHA tính trên clipboard phải khớp SHA trong file đã commit. Sai = dừng, báo PM.

---

## Proposal C — Git-checkable "zero vá tay" definition (🔴4)

**Target:** M1-07 DoD / ADR-0001 §14

**Proposed definition:**

> **"Zero vá tay" — machine-checkable definition:**
>
> Trên branch `attempt/<task-id>`:
> - **Commit #1** = patch nguyên văn từ Lính (author = Chủ hoặc Lính, KHÔNG phải Antigravity)
> - **Commit `mech:*`** = sửa cơ học cho phép (import path, formatting, line ending) — mỗi sửa là commit riêng với prefix `mech:` trong message
> - **Transport** (paste, push, branch switch, clipboard) = hợp lệ, không phải "vá tay"
> - **Gate kiểm tra:** `git diff attempt/<task-id>...HEAD` so với tổng các commit `mech:*`. Nếu có diff ngoài commit gốc + `mech:` = **FAIL — vá tay detected**
>
> Antigravity tại Step 5 chạy gate này tự động. FAIL = escalate, không merge.

---

## Proposal D — Fix stale cross-ref PM_BOOTSTRAP line 89 (stale §8→§9)

**Target:** `.agents/PM_BOOTSTRAP.md` line 89

**Current text:**
```
- **Phase 0 — Externalization (ĐANG CHẠY):** đóng M1-01…06 + file này + RISK-REGISTER + succession exam. Điều kiện thoát: successor PM đậu exam (§8).
```

**Proposed text:**
```
- **Phase 0 — Externalization (ĐANG CHẠY):** đóng M1-01…06 + file này + RISK-REGISTER + succession exam. Điều kiện thoát: successor PM đậu exam (§9).
```

**Rationale:** §8 is now the 7-step workflow section (added 2026-07-20). The succession exam moved to §9. This was flagged by executor but not fixed due to §9.7 compliance.

---

*These proposals are ready for PM review. PM applies them by committing directly to the relevant files on `claude/adr-0001-agent-fleet`.*
