# ADR-0001: Agent-Fleet Coordination Framework (RACI · Routing · DoD-Tier · Gate Contract)

- **Status:** DRAFT v0.2 — bằng chứng vòng 2 đã nhận và audit (2026-07-18): cả 2 instance VERIFIED, smoke Kiro PASS, smoke Ollama transport-PASS/generation-FAIL. Việc còn lại tracked bằng Issues `[M1-*]`. Còn thiếu: mục "BẤT KHẢ THI / RỦI RO / TÔI KHÔNG ĐỒNG Ý" của Antigravity (bắt buộc, vòng 3)
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
2. **Luật oracle:** kẻ viết code không viết test chấm chính code đó (Tier ≥ 2); Gemma không bao giờ sinh *expected values* — chỉ sinh input. Với hằng số lâm sàng, chân lý là **văn liệu** (PubMed), không phải một model khác. *(Hệ quả đã phán quyết 2026-07-18: đề xuất để Gemma viết test `src/domain` bị BÁC — test Tier 2 chỉ do model mạnh ≠ tác giả code viết; cơ chế cụ thể: Issue M1-06.)*
3. **Luật kênh:** bảng routing ghi **model đích**, không ghi tên kênh ("Kiro" là đường ống, không phải cam kết chất lượng).

| Tier | Vùng (instance tự khai) | Tác giả code | Tác giả test | Model đích mặc định | Verified trên kênh | Escalate |
|---|---|---|---|---|---|---|
| 3 — Security | `scripts/`, `.agents/`, CI config | **Antigravity duy nhất** | Antigravity | — (cấm Lính) | N/A | PM audit bắt buộc |
| 2 — Critical (vd lâm sàng `src/domain`) | instance khai | Antigravity hoặc model mạnh đã verify | **Model mạnh ≠ tác giả code**, capsule spec-only, giá trị neo văn liệu | Claude Sonnet 4.5 thinking | ✅ 2026-07-18 | → PM |
| 1 — Consumer (vd `src/ui`) | instance khai | model pin | model pin | Claude Sonnet 4.5 thinking *(tạm — Haiku chưa có biên bản)* | ✅ 2026-07-18 | → Antigravity |
| 0 — Trivial (fixtures input, format, fuzz) | instance khai | Gemma 4 local | — | **ĐÓNG BĂNG** — gemma4:e4b generation FAIL (M1-02) | ❌ 2026-07-18 | → model Tier 1 |

**Luật verify-trước-route (bổ sung 2026-07-20):** route chỉ được trỏ model có biên bản smoke-verify còn hiệu lực (cột Verified = ✅ kèm ngày). Model chưa có biên bản (Haiku, Opus 4.8 trên kênh) không nhận dispatch cho tới khi có. Đúng Luật kênh: bảng này ghi **tên model**, không ghi kênh — gateway ID cụ thể (vd `kiro/claude-sonnet-4.5-thinking`) chỉ xuất hiện trong Phong bì Dispatch tại thời điểm giao việc, là chỗ duy nhất được phép ghi kênh.

**Model khả dụng đã xác minh trên kênh:**
- `kiro/claude-sonnet-4.5-thinking` — smoke 2026-07-18 (PASS, 5.2s; overhead ~6.3k prompt tokens/call do system prompt kênh Kiro).
- **`kr/claude-sonnet-4.5`** (leaf Kiro) — **XÁC NHẬN First Light 2026-07-20 (M1-10):** đối chiếu SQLite `requestDetails` rowid 2021 (`provider=kiro`, `req_model=kiro/claude-sonnet-4.5`, tokens 8787/3148) khớp vân tay biên lai đã bind → run First Light chạy leaf thật, KHÔNG phải combo. ⚠️ **Cảnh báo tên trùng:** tồn tại combo `claude-sonnet-4.5` (owned_by combo, Fusion 6-model) **cùng tên gốc**, chỉ khác prefix `kr/`. Response `model` bị cắt prefix. **Combo `claude-sonnet-4.5` CỤ THỂ này (Fusion, ruột opus-4.8/gpt-5.6-sol/… — tên trùng model, thành viên non-verified) vẫn CẤM** (Án lệ 1 + Fusion). Nhưng combo Fallback **có tên riêng, ruột toàn-verified** thì được — xem Luật Combo/Alias cập nhật 2026-07-21 bên dưới; bằng chứng quyết định là `model_returned` (leaf thật) ∈ Verified, không phải prefix của TARGET.
- `ollama-local/gemma4:e4b` — transport PASS, generation FAIL (content rỗng), ĐÓNG BĂNG.

Model ID phải pin trong config, cấm trôi tự do giữa các lần chạy.

**Luật Combo/Alias (cập nhật 2026-07-21 — cho phép Fallback combo có kiểm soát):** 9router gom nhiều model dưới một tên (combo) với chiến lược Fallback/Round-Robin/Fusion/Capacity.

*Nguyên tắc gốc (đổi so với bản 2026-07-20):* **bằng chứng quyết định là `model_returned` — leaf THẬT đã phục vụ**, KHÔNG phải tên TARGET. Verifier cưỡng chế (§14D.4): `model_returned` (chuẩn hoá) ∈ Verified[tier] → PASS; không thuộc → FAIL. Kiểm này đúng cho cả leaf lẫn combo, và **thay thế luật cũ "TARGET phải có prefix"** (prefix chỉ là proxy cho "không phải combo"; giờ ta kiểm thẳng kẻ phục vụ thật — M1-10 đã chứng minh 9router trả về leaf thật đã chạy trong `model`).

- **Fallback & Capacity-switch combo: CHO PHÉP (kể cả Tier-2)** — nếu **MỌI thành viên đã verified VÀ đủ mạnh cho tier**. Fallback nổ đúng lúc không ai nhìn (429/lỗi), nên một thành viên yếu/chưa-verify là quả bom; verifier chặn qua `model_returned`. Mất tính tái-lập generator (cùng input có thể ra 2 model đã-verify khác nhau) — chấp nhận được, vì OUTPUT vẫn qua Oracle-test + PM-audit; an toàn Tier-2 đến từ *kiểm output*, không từ *pin một generator*.
- **Round-Robin & Fusion: CẤM cho sinh-patch.** Round-robin trôi model không vì độ-bền (chỉ dàn tải); Fusion trộn N model + judge → không có leaf đơn để quy trách.
- **Cấm combo mang tên trùng một model/leaf** (vd combo tên `claude-sonnet-4.5` — nhãn-sai hạ tầng, Án lệ 1). Combo phải mang tên riêng (vd `linh-verified`); ruột chỉ gồm model đã verified.
- **Tiền đề:** mỗi thành viên combo phải smoke-verify + vào `VERIFIED_MODELS` TRƯỚC khi combo được dùng cho dispatch.

Bất biến này không phụ thuộc nút gạt 9router — verifier cưỡng chế trên `model_returned` (§14D.4). *Điểm tin cậy còn lại:* `model_returned` là 9router tự khai — backstop tối hậu vẫn là đối chiếu quota nhà-cung-cấp (ngoài Mac).

Bậc chi phí: Gemma (~0đ) < Haiku < Gemini (quota riêng — toàn bộ deep research) < Opus 4.8 < Claude auth (chỉ quyết định/spec/audit) < Chủ (vô giá). Hai hệ quả: không trả tiền hai lần cho cùng token (chưng cất + link); chi phí lớn nhất là *rework từ handoff hỏng*, không phải token.

## 5. DoD theo Tier (khung generic — instance điền lệnh cụ thể)

- **Tier 0:** toàn bộ gate chuẩn của instance pass (CI xanh).
- **Tier 1:** Tier 0 + xử lý lỗi đúng chuẩn instance (vd BS-B) + hiển thị provenance (vd BS-C) + PM audit + Chủ duyệt visual.
- **Tier 2:** Tier 1 + gate verify tier-đỉnh của instance (vd Numeric Firewall) + test do tác-giả-khác viết, giá trị neo văn liệu có citation + PM verify nguồn (PubMed) + coverage nhánh 100% cho module đó + **Chủ ký**.
- **Tier 3:** chỉ Antigravity viết + PM audit bắt buộc + Chủ duyệt. Lính bị cấm tuyệt đối.

**Gate nhị phân vs rubric định tính (bổ sung 2026-07-21):** mọi gate máy-kiểm-được (`gates.yml`, secret-scan, verifier `completion_sha256`, typecheck, coverage) là **điều kiện cần 100%, không thương lượng** — đây là điều kiện đóng/mở. Rubric văn xuôi (vd thẩm mỹ UI, độ mượt a11y) chỉ là **tín hiệu tư vấn định tính** PM/Chủ tham khảo khi duyệt — **CẤM biến rubric thành ngưỡng số bắt buộc** (vd "≥85/100 mới merge"): một tín hiệu chủ quan không được mang thẩm quyền của gate. Lý do: 85/100 nguy hiểm nếu 15 điểm thiếu là một lỗi toán lâm sàng. Quyết định duyệt = (gate nhị phân PASS) ∧ (PM phán đoán) ∧ (Chủ ký Tier 2) — không có con số chủ quan nào trong đó.

## 6. Gate Contract — `.agents/gates.yml`

```yaml
# schema v1.1 — khớp implementation đã verify (harness v0.1), bổ sung phần bắt buộc cho v0.2
project: <PHẢI đúng tên repo đang đứng — sai label = reject>
version: <semver>
quality_gates:               # map, chạy tuần tự, fail-fast, gate rẻ trước
  <tên_gate>: "<lệnh shell>"
tier_top_verify: "<lệnh>"    # slot verify tier-đỉnh — key TOP-LEVEL, không nằm trong quality_gates
timeout_s: <int>             # trần mỗi gate (harness v0.2 bắt buộc — hiện chưa có, gate treo = treo vĩnh viễn)
```

*Bug harness v0.1 phải sửa (Issue M1-04): parser tự chế nuốt mọi key top-level đứng sau một section (khiến `tier_top_verify`/`clinical_firewall` bị gộp thầm lặng vào `quality_gates`), và thiếu timeout mỗi gate. Khuyến nghị: dùng PyYAML.*

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
- **Cấm truncate kiểu `tail -N`** — chặt đầu file là chặt frontmatter và xoá mù các mục BLOCKED/DO-NOT-TOUCH. Giữ ngân sách dòng bằng **regenerate từ state** (viết lại toàn file từ dữ liệu máy), không bằng cắt đuôi. *(Vi phạm đang tồn tại: `anesthos-sync.sh` dòng `tail -n 100 .agents/handoff.md` — Issue M1-05.)*
- `build_status` sinh từ test-run thật (trace), model tự khai = vô hiệu.

## 9. Bất biến an ninh (Tier 3)

1. Harness auto-reject mọi patch của Lính chạm `.agents/`, `scripts/`, `gates.yml`, CI config.
2. Secrets sống ngoài repo (vd `~/.9router/`); script nạp credentials không được ghi key vào bất kỳ file nào trong repo; secret-scan pre-push fail-closed.
3. Nội dung vùng Tier 3 và file đang viết dở không bao giờ được gửi lên Lính cloud.
4. Thay đổi gate contract cần PM audit + Chủ duyệt.
5. **Incident log 2026-07-18:** key gateway 9router bị hardcode trong `scripts/test_9router_smoke.py` và đã push lên remote SRagent; gate secret-scan chạy PASS mà không bắt được. Xử lý (Issue M1-01): rotate key, script đọc key từ biến môi trường, thêm pattern `sk-*`/`Bearer ...` vào secret-scan. Đây là ca lesson→rule (§11) đầu tiên được thi hành.
6. **Luật Anchor (bổ sung v0.2):** mọi lệnh giao việc và mọi báo cáo giữa các actor phải mở đầu bằng `repo + branch + HEAD SHA + cwd` lấy từ output lệnh thật; artifact nhắc đến không có anchor = coi như không tồn tại. (Nguồn gốc: sự cố dán nhãn AnesthOS/SRagent ở vòng 1.)
7. **File PM-owned chỉ PM ghi (bổ sung v0.3):** `.agents/PM_BOOTSTRAP.md`, `.agents/EXAM_*`, `docs/adr/**` thuộc quyền ghi của PM. Executor phát hiện vấn đề trong các file này → nêu trong báo cáo, không tự sửa. Đề thi kế nhiệm và đáp án **không bao giờ được commit** vào repo. (Nguồn gốc: sự cố 2026-07-19 — executor commit đề + đáp án và "redact" lỗi cài sẵn của đề vì gate secret-scan bắn nhầm vào fixture.)

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
| Trạng thái pilot | **VERIFIED 2026-07-18:** artifacts @ branch `claude/sr-agent-pipeline-design-rqtctp` SHA `e047da8`; 363/363 pytest. Còn lỗi label: `gates.yml` ghi `project: "AnesthOS"` trong repo SRagent (M1-05) | **VERIFIED 2026-07-18:** `gates.yml` đủ 5 gate npm + `qc_trace.json` máy sinh @ SHA `48b792a`; harness IDENTICAL byte-for-byte với bản SR-Agent — **portability đã chứng minh** |

## 13. Kế nhiệm PM (bổ sung v0.3)

**PM là VAI TRÒ, không phải model.** Hồ sơ kế nhiệm: `.agents/PM_BOOTSTRAP.md` (luật + án lệ + checklist + nghi thức khởi động phiên + succession exam) và `docs/adr/RISK-REGISTER.md`. Model kế nhiệm chỉ được trust với audit thật sau khi đậu succession exam (BOOTSTRAP §9). Thay đổi luật chỉ có hiệu lực khi thành commit vào ADR — không phiên chat nào sửa được hiến pháp bằng lời.

---

**Kết quả 5 câu hỏi mở (audit vòng 2, 2026-07-18):**
1. ⚠️ MỘT NỬA — Kiro PASS (`claude-sonnet-4.5-thinking`, 5.2s); Ollama HTTP 200 nhưng `content` rỗng, `finish_reason: length`, 5 completion tokens — thinking mode nuốt sạch budget. Đường sinh chưa dùng được → Issue M1-02. Lưu ý thêm: smoke script đã commit test model khác (`qwen2.5:7b`, `claude-sonnet-5`) với transcript nộp (`gemma4:e4b`, `sonnet-4.5-thinking`) — phải pin model ID.
2. ✅ Anchor chính xác 100%, PM đã đối chiếu cả 2 remote.
3. ✅ Xác nhận + portability verified (xem bảng).
4. ❌ BÁC MỘT PHẦN — cho Gemma viết test `src/domain` vi phạm Luật oracle §4.2. Cơ chế đúng: Issue M1-06.
5. ⚠️ Key nằm ngoài repo đúng chuẩn (`~/.9router/db/data.sqlite`; báo cáo ghi `~/.omniroute` là sai đường dẫn), NHƯNG audit phát hiện key gateway hardcode trong `test_9router_smoke.py` đã push — Incident §9.5, Issue M1-01.

---

## 14. Quy trình Vận hành Thực tế (7 Bước & Mẫu mở Task)

Để đảm bảo hiệu quả làm việc và loại bỏ hoàn toàn lỗi "vá tay thay hệ thống", mọi hoạt động từ khi mở task đến khi tích hợp code phải đi qua đúng 7 bước dưới đây:

### A. Mẫu mở task (Kickoff) do Chủ viết
Mỗi khi khởi tạo một task mới, Chủ gửi đúng 5 dòng theo cấu trúc sau (không tự viết giải pháp hay cách làm):
```markdown
[TASK MỚI]
Tên: <1 dòng>
Mục tiêu: <1-2 câu — kết quả mong muốn, không phải cách làm>
Vùng chạm: <file/module nếu biết, hoặc để PM khảo sát>
Ràng buộc: <deadline / ngân sách token / "không có">
Ghi chú: <optional, vd "đây là First Light — cần biên lai dispatch đầu tiên">
```

### B. Quy trình vận hành 7 bước

| Bước | Diễn giải | Vai trò thực hiện |
| :--- | :--- | :--- |
| **Step 1** | Gửi yêu cầu Kickoff theo mẫu trên cho PM. | **Chủ** |
| **Step 2** | Mở GitHub Issue + Thiết lập DoD theo Tier phù hợp. Nếu cần huy động Lính: soạn **Phong bì Dispatch** và **commit thành file `.agents/dispatch/<task-id>.md` TRƯỚC khi Chủ dispatch** (PM soạn nội dung; nếu PM không có quyền đẩy repo đó thì executor commit hộ nguyên văn — file dispatch không thuộc nhóm PM-owned §9.7). Format file: `TASK:` link Issue / `TARGET:` gateway ID pin (vd `kiro/claude-sonnet-4.5-thinking`) / `BRANCH: attempt/<task-id>` / `---` / capsule spec-only. **Không ghi SHA vào trong file** (tự-tham-chiếu là bất khả thi): Capsule-SHA256 = 12 hex đầu SHA-256 của file *bản đã commit*, do `scripts/new-attempt.sh` tính và in ra; Chủ paste nguyên văn cả file vào opencode, opencode phải echo lại SHA trước khi làm — lệch = dừng, báo PM. Nếu là Tier 3, giao thẳng cho Antigravity (Lính cấm đụng). | **PM (Claude auth)** |
| **Step 3** | Mở opencode (hoặc CLI tool) trỏ 9router đúng model pin đã chỉ định trong Phong bì, dán capsule nhận được. Lấy patch trả về từ Lính và commit lên nhánh `attempt/<task-id>` trong worktree riêng (không chạm vào cây làm việc chính). | **Chủ** |
| **Step 4** | Thông báo cho Antigravity một câu: *"attempt/<task-id> đã có patch"* (tuyệt đối không dán trực tiếp nội dung patch vào cửa sổ chat). | **Chủ** |
| **Step 5** | Kéo (pull) worktree về -> thực hiện pre-flight validation (`git apply --check` -> path-guard -> secret-scan -> typecheck) -> chạy các gates bằng QC Harness trên snapshot -> xuất trace -> nếu PASS thì thực hiện tích hợp, push và mở PR đính kèm trace. Nếu FAIL thì tự kích hoạt quy trình leo thang (escalation) có trần. | **Antigravity** |
| **Step 6** | Audit PR độc lập: đối chiếu Anchor khớp với môi trường thực tế -> rà soát từng mục DoD -> đối chiếu giá trị hằng số lâm sàng Tier 2 với PubMed/văn liệu thực tế. | **PM (Claude auth)** |
| **Step 7** | Đánh giá trực quan (Tier 1 xem lướt, Tier 2 ký duyệt lâm sàng) -> tiến hành merge PR -> đóng Issue -> hệ thống tự động sinh lại tệp `handoff.md`. | **Chủ** |

*Ranh giới thao tác*: Chủ thực hiện di chuyển thủ công (paste, chuyển branch); việc tự ý chỉnh sửa nội dung patch của Lính trả về bị cấm (FAIL). Nếu patch sai, báo lại PM để thực hiện leo thang.

### C. "Zero vá tay" — định nghĩa máy-kiểm (bổ sung 2026-07-20)

Trên branch `attempt/<task-id>`, gate tự động của Antigravity (Step 5) kiểm đúng 3 điều:
1. **Commit #1** = patch nguyên văn từ Lính (author là Chủ hoặc phiên dispatch — **không phải Antigravity**).
2. **Mọi commit sau commit #1** trên branch phải mang prefix `mech:` (sửa cơ học được phép: import path, formatting, line ending — mỗi sửa một commit riêng, message nói rõ sửa gì).
3. **PR head SHA == tip của branch `attempt/<task-id>`** — merge không kèm sửa nội dung.

Vi phạm bất kỳ điều nào = **vá tay detected** → FAIL, escalate theo thang §7, không merge. Transport (paste, push, chuyển branch, clipboard) là hợp lệ theo định nghĩa — đó là vai của Chủ trong Dispatch Mode v1 (Manual Human Router).

### D. Biên lai dispatch — bằng chứng chính tắc rằng Lính đã làm (bài học First Light M1-07, 2026-07-20)

**Vì sao điều C.1 (author ≠ Antigravity) một mình KHÔNG đủ:** git identity local của máy Chủ đặt là "Antygravity Agent", nên author-fingerprint **không phân biệt được** ai thật sự commit. §14C.1 vẫn giữ nhưng **KHÔNG còn là bằng chứng chính** — nó chỉ là tín hiệu phụ.

**Bằng chứng chính tắc = biên lai buộc-bằng-hash**, sinh tự động bởi `scripts/dispatch-runner.py`, kiểm tự động bởi `sr_agent/store/dispatch_verifier.py`, là **gate cứng của Step 5**:
1. Runner gọi 9router thật, tự trích code từ completion, **ghi thẳng** vào file đích trong worktree, ghi biên lai `.agents/traces/<task-id>/dispatch.jsonl` gồm: `capsule_sha256` (từ phong bì đã commit), `completion_sha256` (hash của file vừa ghi), `model_requested/target_model_raw/model_returned`, `prompt_tokens/completion_tokens` (từ gateway), `latency_ms`, `status_code`.
2. Verifier **recompute** `sha256(file patch đã commit)[:12]` và bắt buộc **khớp** `completion_sha256` trong biên lai → chứng minh *code commit lên CHÍNH LÀ code model sinh ra*. Đây là thứ đóng cửa "hệ 2 não": không thể commit code khác cái model trả về.
3. Verifier bắt `capsule_sha256` khớp phong bì đã commit; `prompt_tokens`/`completion_tokens` > 0; `status_code` == 200; `model_requested`/`target_model_raw` khớp TARGET phong bì (qua `normalize_model_name`).
4. **Kiểm provenance trên LEAF thật (2026-07-20 → cập nhật 2026-07-21 cho Fallback combo):** bằng chứng quyết định là **`model_returned` — leaf THẬT đã phục vụ**. Verifier chuẩn hoá `model_returned` và bắt buộc **∈ `VERIFIED_MODELS`[tier]** → đây là kiểm CỨNG, đúng cho cả leaf lẫn Fallback-combo. *(Đổi so với M1-11: M1-11 dựa vào `req_model` có-prefix ∈ VERIFIED — proxy cho "không phải combo". Nay Fallback combo được phép, nên `req_model` có thể là tên combo; guarantee chuyển sang kẻ-phục-vụ-thật `model_returned`, khớp Luật Combo/Alias §4.)* Vẫn giữ: nếu 9router trả về tên combo/alias thay vì leaf (không phân giải được kẻ phục vụ) → UNVERIFIABLE → FAIL; combo tên-trùng-model → cấm (Án lệ 1). **Điểm tin cậy:** `model_returned` là 9router tự khai (ranh-giới-2) — backstop tối hậu là quota nhà-cung-cấp (ngoài Mac). *(Nợ M1-14: cập nhật `dispatch_verifier.py` chuyển hard-check sang `model_returned ∈ VERIFIED`, nạp `VERIFIED_MODELS` từ một-nguồn-chân-lý thay vì hardcode; + cổng CI M1-13.1 chưa xanh thật.)*

**Ngữ nghĩa của binding `completion_sha256` — điểm-thời-gian, KHÔNG vĩnh viễn (bài học M1-11):** binding là gate **tại thời điểm dispatch**, chạy trên worktree `attempt/<task-id>` TRƯỚC merge (verifier ưu tiên đọc file trong worktree attempt). Sau khi merge, nếu file đó tiến hoá hợp lệ qua một task Tier-3 khác (vd M1-11 sửa +2 dòng test), `sha256(file trên main)` sẽ KHÁC `completion_sha256` cũ — đây là **hành vi đúng**, không phải gian lận. **Cấm diễn giải một verifier-FAIL chạy-lại-trên-main-đã-tiến-hoá thành "dispatch cũ giả mạo".** Bằng chứng lịch sử của một dispatch được chốt tại SHA commit của attempt lúc đó (vd First Light tại `4a2df77`, tokens 8787/3148, SQLite rowid 2021), không phải bằng cách chạy lại verifier trên main về sau.

**Luật:** không có biên lai hợp lệ (verifier PASS) = tuyên bố "Lính đã làm" là **vô hiệu**, không được đóng Issue. Token count + latency đến từ gateway (không gõ tay được); completion_sha256 buộc vào file thật. *Điểm tin cậy còn lại (runner vừa sinh vừa hash — Tier 3, đã audit): nâng cấp về sau bằng đối chiếu log server-side 9router.*

### E. Bổ sung vận hành (duyệt từ proposal 14-step, 2026-07-21)

- **E.1 — Design tokens trong phong bì (Tier 1 UI):** dispatch Tier 1 Consumer UI **được phép** thêm mục `## UI Design Tokens` (màu, typography, spec component) vào phong bì `.agents/dispatch/<task-id>.md`, thay vì nhồi vào `CLAUDE.md` chung (tránh phình token trên task không-UI). Ghi **tool-agnostic**: nội dung là tokens đã chưng cất, không phụ thuộc một extension/scraper cụ thể; vẫn nằm trong capsule đã commit (tính vào Capsule-SHA256).
- **E.2 — Reset ngữ cảnh khi retry (nối §7 escalation):** một attempt fail **2 gate liên tiếp** trên cùng `attempt/<task-id>` → **bắt buộc re-spawn phiên Lính với ngữ cảnh sạch** chỉ chứa: capsule gốc + trace lỗi + state hiện tại. Cấm mang lịch sử chat cũ (chống vòng ảo giác). Worktree giữ nguyên — chỉ reset ngữ cảnh model, không reset filesystem.
- **E.3 — Double-blind cross-family audit (PILOT, CHƯA bắt buộc):** cho Tier 2 lâm sàng, PM **có thể** kích một subagent **khác GIA ĐÌNH model với tác giả code** (vd Gemini audit code Claude — de-correlate điểm mù #13) chạy audit mù, ghi `.agents/audits/<task-id>-blind.md` **trước khi** đọc đánh giá khác, rồi PM tổng hợp. **Trạng thái: PILOT** — chạy thử ≥1 lần trên task Tier 2 thật rồi mới xét nâng thành bắt buộc (bài học "không cơ khí hoá nghi thức chưa từng chạy"). Tier 3 để tuỳ PM, không mặc định bắt buộc (tránh ma sát trên thay đổi bảo mật vụn).
