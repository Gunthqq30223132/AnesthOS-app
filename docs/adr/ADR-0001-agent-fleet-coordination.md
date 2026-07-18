# ADR-0001: Agent-Fleet Coordination Framework (RACI · Routing · DoD-Tier · Gate Contract)

- **Status:** DRAFT v0.1 — chờ phản biện vòng 2 của Antigravity + bằng chứng smoke test 9router (xem §12)
- **Date:** 2026-07-18
- **Authors:** Claude auth (PM/Auditor, cloud) — đồng thiết kế với Antigravity (Orchestrator, local); phê duyệt cuối: Chủ
- **Scope:** Đây là **FRAMEWORK dùng chung, project-agnostic** cho mọi dự án vận hành bằng bộ công cụ Antigravity + 9router (Kiro/Ollama) + Claude auth. AnesthOS và SR-Agent là hai *instance* tham chiếu. Kiến trúc nghiệp vụ/lâm sàng của từng app **không** thuộc phạm vi ADR này. Khi có project thứ ba, tách ADR này ra repo template `agent-fleet`.

---

## 1. Bối cảnh

Một người vận hành (Chủ) điều phối một đội agent hỗn hợp cloud/local để phát triển phần mềm. Rủi ro cốt lõi: (a) nhiều writer ghi đè nhau trên một working tree; (b) model yếu tạo ra output sai nhưng "trông xanh"; (c) hằng số quan trọng sai mà mọi gate đều pass vì test và code cùng một tác giả; (d) chi phí token phình không kiểm soát. ADR này là hiến pháp chống 4 rủi ro đó.

## 2. Phân loại thành phần: ACTOR / KÊNH / KHO

| Loại | Thành phần | Vai trò |
|---|---|---|
| Actor | **Chủ** (User) | Quyết định cuối, ký lâm sàng, duyệt visual diff, ferry Claude↔Gemini |
| Actor | **Claude auth** (PM/Auditor, cloud) | Spec, kế hoạch, ADR, Research Brief, audit PR độc lập. Không sửa code mình audit |
| Actor | **Antigravity** (Orchestrator, local) | Single-writer duy nhất của working tree; thiết kế core; điều phối Lính; QC local |
| Actor | **Lính** — model đích qua kênh Kiro (Opus 4.8, Haiku…) hoặc Ollama (Gemma 4 local) | Sinh patch theo tier (§4). Không bao giờ tự ghi vào tree |
| Actor | **Gemini** | Deep-research executor theo Research Brief (§10) |
| Kênh | **9router** (`http://localhost:20128/v1`) | Đường ống HTTP tới Lính. Không phải actor. Nhãn kênh ≠ cam kết model |
| Kho | **GitHub** | Substrate điều phối: Issues/Milestones/PR/CI/ADR. Lưu *quyết định + code*, không lưu data dump |
| Kho | **NotebookLM** | Lăng kính tra cứu có trích nguồn cho Chủ. Không bao giờ là bản duy nhất của tài liệu nào |
| Kho | **Notion** | Second brain của Chủ. Bài học phải được thăng cấp thành luật trong repo (§11) |

## 3. RACI

| Hoạt động | Chủ | Claude auth | Antigravity | Lính | Gemini |
|---|---|---|---|---|---|
| Vision / quyết định cuối | **A/R** | C | C | — | — |
| Spec, ADR, DoD | A | **R** | C | — | — |
| Kế hoạch, Issues, Milestones | A | **R** | C | — | — |
| Deep research | R (ferry) | A (brief + verify) | — | — | **R** |
| Viết code production | — | — | **A** | R (theo tier §4) | — |
| Viết test Tier 2 (oracle) | — | C (verify hằng số) | A | **R** (≠ tác giả code, §4) | — |
| Tích hợp / ghi working tree | — | — | **R duy nhất** | ✗ cấm | — |
| QC local (harness, watcher) | — | — | **R** | — | — |
| CI (phán quyết cuối về gate) | — | C | C | — | — |
| Audit PR | I | **R** | C | — | — |
| Merge | **A** | R (recommend) | — | — | — |
| Ký lâm sàng (instance y khoa) | **A/R** | C (verify PubMed) | — | ✗ | — |
| Vùng Tier 3 (`scripts/`, `.agents/`) | A | R (audit bắt buộc) | **R** (duy nhất được viết) | ✗ cấm | — |

## 4. Routing theo Tier + kinh tế token

**Ba định luật:**
1. **Luật model yếu:** model yếu chỉ nhận việc mà output sai *rẻ-để-phát-hiện-và-vứt*.
2. **Luật oracle:** kẻ viết code không viết test chấm chính code đó (Tier ≥ 2); Gemma không bao giờ sinh *expected values* — chỉ sinh input. Với hằng số lâm sàng, chân lý là **văn liệu** (PubMed), không phải một model khác.
3. **Luật kênh:** bảng routing ghi **model đích**, không ghi tên kênh ("Kiro" là đường ống, không phải cam kết chất lượng).

| Tier | Vùng (instance tự khai) | Tác giả code | Tác giả test | Model đích mặc định | Escalate |
|---|---|---|---|---|---|
| 3 — Security | `scripts/`, `.agents/`, CI config | **Antigravity duy nhất** | Antigravity | — (cấm Lính) | PM audit bắt buộc |
| 2 — Critical (vd lâm sàng `src/domain`) | instance khai | Antigravity hoặc Opus 4.8 | **Model mạnh ≠ tác giả code**, capsule spec-only, giá trị neo văn liệu | Opus 4.8 | → PM |
| 1 — Consumer (vd `src/ui`) | instance khai | Haiku | Haiku | Haiku → Opus khi fail | → Antigravity |
| 0 — Trivial (fixtures input, format, fuzz) | instance khai | Gemma 4 local | — | Gemma → Haiku khi fail | → Kiro |

Bậc chi phí: Gemma (~0đ) < Haiku < Gemini (quota riêng — toàn bộ deep research) < Opus 4.8 < Claude auth (chỉ quyết định/spec/audit) < Chủ (vô giá). Hai hệ quả: không trả tiền hai lần cho cùng token (chưng cất + link); chi phí lớn nhất là *rework từ handoff hỏng*, không phải token.

## 5. DoD theo Tier (khung generic — instance điền lệnh cụ thể)

- **Tier 0:** toàn bộ gate chuẩn của instance pass (CI xanh).
- **Tier 1:** Tier 0 + xử lý lỗi đúng chuẩn instance (vd BS-B) + hiển thị provenance (vd BS-C) + PM audit + Chủ duyệt visual.
- **Tier 2:** Tier 1 + gate verify tier-đỉnh của instance (vd Numeric Firewall) + test do tác-giả-khác viết, giá trị neo văn liệu có citation + PM verify nguồn (PubMed) + coverage nhánh 100% cho module đó + **Chủ ký**.
- **Tier 3:** chỉ Antigravity viết + PM audit bắt buộc + Chủ duyệt. Lính bị cấm tuyệt đối.

## 6. Gate Contract — `.agents/gates.yml`

```yaml
# schema v1 — framework chỉ biết cấu trúc này, không biết nội dung lệnh
project: <tên instance>
gates:                # chạy tuần tự, fail-fast, gate rẻ trước
  - name: <định danh>
    cmd: <lệnh shell>
    timeout_s: <int>
tier_top_verify:      # slot gate verify của tier cao nhất (instance điền)
  cmd: <lệnh shell>
```

**Bất biến (invariants):**
1. **CI là phán quyết, local là tư vấn.** CI *không đọc* `gates.yml` — workflow CI giữ danh sách gate cứng riêng; thêm một bước CI so khớp `gates.yml` ⊇ danh sách chuẩn. Patch độc sửa `gates.yml` để rút răng gate sẽ bị CI bắt.
2. **Pre-flight** (chạy trước mọi gate, rẻ nhất trước): `git apply --check` → path-allowlist (patch chạm vùng Tier 3 → reject ngay) → secret-scan nội dung patch → typecheck/parse.
3. **Trace** (`.agents/traces/<run_id>.json`, append-only, không dùng đơn-file): bắt buộc chứa `base_sha`, `gates_yml_hash`, exit code + duration từng gate, cờ `stale` nếu tree-hash đổi trong lúc chạy. Trace commit kèm PR để PM đối chiếu với CI.

## 7. Concurrency & Single-Writer Protocol

1. **Watcher chỉ nhìn, không ghi, không dispatch cloud tự động.** Phạm vi watch whitelist (vd `src/`), loại trừ `.agents/`, `.git`, deps. Kích QC sau debounce + parse được cú pháp.
2. **QC chạy trên snapshot bất biến** (`git stash create`/SHA), trace ghi tree-hash; tree đổi giữa chừng → trace `stale`, vứt, xếp lượt mới ("latest wins").
3. **Áp patch kiểu compare-and-swap:** patch sinh trên base S chỉ áp khi tree vẫn ở S; mọi attempt của Lính chạy trong `git worktree` riêng (`attempt/<task-id>`) — cây chính của Chủ không bao giờ thấy churn.
4. **Thang escalate:** Gemma fail → Haiku/Opus → Antigravity tự sửa → **PM xét lại SPEC** (fail xuyên 3 tầng năng lực thường là spec sai) → Chủ (nhận phương án A/B kèm trade-off, không nhận stack trace).
5. **Escalation Bundle** `.agents/escalations/<task-id>/`: `state.md` (issue link, base SHA, attempts, error class) + `attempt-N.patch` (không bao giờ ở dạng đã-áp) + traces + lệnh repro 1 dòng. Đóng băng = cây chính sạch ở commit xanh cuối.
6. **Budget đa chiều, persist qua crash:** 2 attempt/nấc model + trần wall-clock + trần chi phí token. Counter nằm trong `state.md`.
7. **Hai quy tắc đường-dẫn cứng trong harness:** kẻ sửa code không được đụng file test đang fail; kẻ sửa test không được đụng code. Failure chạm vùng Tier 2 không bao giờ được âm thầm auto-fix.
8. **Hidden set:** một phần test không bao giờ lộ cho tác giả code (kể cả qua failure message), chỉ chạy ở gate cuối.

## 8. Handoff Protocol — `.agents/handoff.md`

- ≤ 60 dòng, YAML frontmatter (`build_status`, `base_sha`, `now`, `blocked`, `do_not_touch`), một writer duy nhất (Antigravity).
- **Cấm truncate kiểu `tail -N`** — chặt đầu file là chặt frontmatter và xoá mù các mục BLOCKED/DO-NOT-TOUCH. Giữ ngân sách dòng bằng **regenerate từ state** (viết lại toàn file từ dữ liệu máy), không bằng cắt đuôi.
- `build_status` sinh từ test-run thật (trace), model tự khai = vô hiệu.

## 9. Bất biến an ninh (Tier 3)

1. Harness auto-reject mọi patch của Lính chạm `.agents/`, `scripts/`, `gates.yml`, CI config.
2. Secrets sống ngoài repo (vd `~/.9router/`); script nạp credentials không được ghi key vào bất kỳ file nào trong repo; secret-scan pre-push fail-closed.
3. Nội dung vùng Tier 3 và file đang viết dở không bao giờ được gửi lên Lính cloud.
4. Thay đổi gate contract cần PM audit + Chủ duyệt.

## 10. Research Pipeline (Gemini)

Trigger cơ khí: **mỗi Issue kèm danh sách giả định; giả định vỡ → PM viết Research Brief** (câu-hỏi-quyết-định + facts quyết định cần chính xác cao + format output). Output Gemini bắt buộc 3 phần: tóm tắt 80/20; bảng `claim → nguồn → độ tin`; mục **"đã lược bỏ những gì"**. PM chỉ verify claim quyết định. Lưu trữ địa-chỉ-hoá: bản full → Notion/NotebookLM; bản chưng cất + link → `docs/research/` hoặc Issue sinh ra nó.

## 11. Lesson → Rule

Kinh nghiệm đã trả giá (Notion note) phải được thăng cấp thành luật máy-thi-hành trong repo (CLAUDE.md, gate, path-block). Second brain lưu trải nghiệm; repo lưu luật; chỉ luật được thi hành. Sau mỗi milestone merge: refresh bộ nguồn NotebookLM.

## 12. Reference Instances & trạng thái kiểm chứng

| Slot framework | Instance: SR-Agent (Python) | Instance: anesthos-app (TypeScript) |
|---|---|---|
| Gate chuẩn | `scan-history-secrets`, `gate_m6.sh`, `python3 -m pytest`, `gate_d32.sh` | `npm run secret-scan`, `lint:boundary`, `build`, `test`, `test:coverage` |
| Tier-top verify | `tests/test_guards.py` (Numeric Firewall) | Numeric Firewall lâm sàng — **chưa tồn tại, phải tạo** |
| Vùng Tier 2 | `tools/guard/`, pipeline rubric | `src/domain/` (BS-B/BS-C/BS-F) |
| Trạng thái pilot | Harness đã chạy 5/5 PASS (theo báo cáo) — **chưa audit được: chưa push** | **Manifest chưa tồn tại** — đây là bài test portability thật |

**Câu hỏi mở cho vòng phản biện 2 (Antigravity trả lời kèm bằng chứng):**
1. Smoke test 9router: transcript 2 lần gọi thật qua `:20128` (1 → model Claude qua Kiro, 1 → Gemma qua Ollama), che key.
2. Toàn bộ artifacts đã tạo (`agent-qc-harness.py`, `active_watcher.py`, `gates.yml`, sync script) đang nằm ở **repo nào / branch nào / SHA nào**? Push lên branch + mở PR để PM audit code thật.
3. Pilot harness đã chạy trên SR-Agent (bằng chứng fingerprint) — xác nhận, và tạo `gates.yml` instance cho anesthos-app (5 gate npm) để chứng minh tính project-agnostic.
4. Ai viết test cho `src/domain`? (Không được là Antigravity nếu Antigravity viết code domain — Luật oracle.)
5. `setup_9router_credentials.py` ghi key vào đâu? Xác nhận không có đường ghi vào repo.
