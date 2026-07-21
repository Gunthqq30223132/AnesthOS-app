# PLAYBOOK — Khởi động & vận hành một project trên hệ agent-fleet

> Trả lời một câu: **"Tôi (Chủ) bắt đầu / vận hành một project — làm gì, theo thứ tự nào?"**
> Nguồn luật: `docs/adr/ADR-0001` (hiến pháp) · `.agents/PM_BOOTSTRAP.md` (vai PM) · `docs/adr/RISK-REGISTER.md`.
> Bản chuẩn v2 (2026-07-21) — gộp dây chuyền provenance (biên lai token buộc-bằng-hash), Dispatch Mode v1 (Manual Human Router), §14E. Thay bản v1 (Fable 5, 2026-07-19).
> Là tiền thân template `agent-fleet` — tách repo riêng khi project #2 chạy xong First Light.

## 0. Bức tranh 30 giây

| Vai | Ai | Làm gì | Không được làm |
|---|---|---|---|
| **Chủ** | Bạn | Kickoff, ferry dispatch, duyệt merge, ký Tier 2, giữ đề thi | Vá tay thay hệ thống |
| **PM** | Claude auth (Opus 4.8) | Issue+DoD, phong bì, spec/ADR, audit bằng-chứng | Viết code mình audit; tin báo cáo chưa đối chiếu remote |
| **Antigravity** | IDE local | **Single-writer duy nhất**, QC harness, tích hợp, PR | Viết test cho code Tier 2 của mình; sửa file PM-owned |
| **Lính** | Model qua 9router `:20128` | Trả **patch** theo capsule | Ghi tree; nhận việc ngoài tier; đụng `.agents/`,`scripts/`,CI |
| **Gemini** | Chat riêng | Deep research theo Brief | — |
| Kho | GitHub (điều phối+code) · Notion (trải nghiệm) · NotebookLM (tra cứu) | | NotebookLM không bao giờ giữ bản duy nhất |

**KÊNH ≠ ACTOR:** 9router là đường ống HTTP, không phải người làm. Bảng routing ghi **tên model**; gateway ID (có prefix, vd `kr/claude-sonnet-4.5`) chỉ nằm trong phong bì lúc giao việc.

**5 luật xương sống:** ① **Anchor** — mọi báo cáo mở đầu `repo+branch+HEAD+cwd` từ `preflight.sh` chạy sát giờ nộp; ② **Oracle** — kẻ viết code không viết test chấm code đó (Tier≥2), model yếu không sinh expected value, hằng số neo văn liệu; ③ **Single-writer** — chỉ Antigravity ghi tree, Lính trả patch, attempt trong worktree riêng; ④ **Gate nhị phân tối thượng** — máy-kiểm 100% bắt buộc, rubric văn xuôi chỉ là tín hiệu tư vấn (cấm thành ngưỡng số); ⑤ **Chịu-dừng** — Chủ vắng thì hệ đứng im an toàn, không auto-merge, deploy là cổng người riêng.

---

## 1. VÒNG ĐỜI MỘT TASK — 7 bước (Dispatch Mode v1: Manual Human Router)

```
1. Chủ    → Kickoff 5 dòng (mục tiêu, KHÔNG phải cách làm)
2. PM     → GitHub Issue + DoD theo Tier + commit Phong bì .agents/dispatch/<id>.md
            (TARGET = model ID CÓ prefix provider ∈ Verified; CẤM tên combo trần)
3. Chủ    → scripts/new-attempt.sh <id>   (tạo worktree attempt/<id>, in Capsule-SHA)
            → scripts/dispatch-runner.py    (gọi 9router → Lính trả patch → ghi biên lai)
              opencode thủ công cũng được; echo Capsule-SHA khớp mới làm
4. Chủ    → báo Antigravity một câu: "attempt/<id> có patch"  (không dán patch vào chat)
5. Antigr → pre-flight (apply-check→path-guard→secret-scan→typecheck) → gates.yml
            → VERIFIER (4 đẳng thức, xem dưới) → PASS thì PR + trace ; FAIL thì escalate
6. PM     → audit độc lập: anchor thật (đối chiếu remote TRƯỚC khi đọc văn) → DoD từng mục
            → hằng số Tier 2 neo PubMed ; [Tier 2: pilot double-blind cross-family §14E.3]
7. Chủ    → duyệt (Tier 1 lướt / Tier 2 ký) → merge → đóng Issue → handoff regenerate
```

**Dây chuyền provenance — verifier ở Bước 5 bắt đủ 4 đẳng thức máy-kiểm** (thứ khiến *"Lính đã làm"* là đẳng thức, không phải lời khai):
1. `capsule_sha256` == phong bì đã commit → **đúng đề bài**.
2. `completion_sha256` == `sha256(file patch commit)` → **code này chính là model sinh ra** (đóng cửa "hệ 2 não").
3. `req_model` có prefix ∧ ∈ VERIFIED → **đúng model đã kiểm định, không phải combo mù**.
4. `prompt/completion tokens` + `latency` từ gateway → **cuộc gọi thật, không gõ tay được**.
> Binding là gate **tại-thời-điểm-dispatch** trên worktree attempt; bằng chứng lịch sử chốt ở SHA attempt lúc đó, không phải chạy-lại verifier trên main về sau (main tiến hoá làm hash khác đi là ĐÚNG).

**Ranh giới "zero vá tay" (máy-kiểm, §14C):** ferry (paste/push/chuyển branch) = hợp lệ; sửa NỘI DUNG patch Lính = FAIL. Commit #1 = patch Lính; sửa cơ học sau đó = commit riêng prefix `mech:`.

**Escalation có trần (§7 + §14E.2):** 2 attempt/nấc: Gemma → model mạnh → Antigravity tự sửa → **PM xét lại spec** (fail xuyên 3 tầng thường là spec sai) → Chủ. Fail **2 gate liên tiếp** → re-spawn Lính ngữ cảnh sạch (capsule + trace lỗi + state, cấm mang chat cũ). Kẻ sửa code không đụng test đang fail và ngược lại.

---

## 2. NGÀY 0 — Khởi tạo project mới (một buổi, 7 bước)

1. **Chủ:** tạo repo + clone. **Thư mục local PHẢI trùng tên repo** (vụ `~/projects/AnesthOS` chứa SRagent là gốc Án lệ 1). Add repo vào scope phiên PM.
2. **Chủ:** viết 1 trang khai sinh, ferry PM: (a) mục tiêu; (b) **vùng rủi ro cao nhất** — cái gì sai gây hại người/tiền/pháp lý; (c) chuẩn chất lượng domain; (d) ràng buộc.
3. **PM:** khai INSTANCE — **Tier map** (Tier 3 = `scripts/`,`.agents/`,CI mặc định; Tier 2 = critical từ mục (b)); **`gates.yml`** (lệnh thật, label đúng tên repo); **`tier_top_verify`** (gate tier đỉnh kiểu Numeric Firewall — **chưa có thì vùng Tier 2 ĐÓNG BĂNG với Lính**); **DoD theo tier**.
4. **Antigravity:** bê khung **không sửa** — `agent-qc-harness.py`, `preflight.sh`, `new-attempt.sh`, `dispatch-runner.py`, `dispatch_verifier.py`, `check_gates_superset.py` (phải sửa mới chạy = bug framework, báo PM). Điền instance `gates.yml`, wire **Gate 0** superset + gate chuẩn vào CI. Copy khung ADR/BOOTSTRAP/RISK-REGISTER.
5. **Antigravity:** nghiệm thu đầu — `preflight.sh` (anchor+9router+model pin+gh+tree) → harness → trace xanh → push → báo cáo có anchor.
6. **PM:** mở board GitHub Issues, prefix `[<Mã>-M0-xx]`, kết thúc bằng issue **First Light**.
7. **FIRST LIGHT** — một task nháp đi trọn 7 bước, **có biên lai provenance hợp lệ** (verifier PASS), retro 30'. *Setup xong ≠ sẵn sàng — đường ống chưa từng dẫn nước là đường ống chưa tồn tại.*

---

## 3. NGHI THỨC & VẬN HÀNH

- **PM mỗi phiên (BOOTSTRAP §1):** đọc ADR → quét trigger RISK-REGISTER → board → handoff. Chat cũ = không tin cậy.
- **Antigravity:** `preflight.sh` đầu phiên; anchor mọi báo cáo = output preflight dán nguyên văn; kết bằng mục "BẤT KHẢ THI / RỦI RO / TÔI KHÔNG ĐỒNG Ý".
- **Chủ:** chỉ ferry con trỏ (link Issue/branch/file), không ferry nội dung dài — "chat trỏ, repo chứa".
- **Gặp ẩn số → research:** PM viết **Research Brief** (câu-hỏi-quyết-định + facts chính-xác-cao + format) → Chủ ferry Gemini → Gemini trả 80/20 + bảng `claim→nguồn→độ-tin` + mục "đã lược bỏ" → PM verify claim quyết định → full vào Notion/NotebookLM, chưng cất + link vào `docs/research/`.
- **Suy giảm (quét cột "Tín hiệu sớm" RISK-REGISTER):** mất Ollama → route cloud; mất Kiro (A2, heartbeat 15') → Antigravity tự code + PM audit dày; mất PM → Chủ vận hành tay bằng checklist §3/§4; Chủ vắng → **hệ đứng im an toàn** (không auto-merge, mọi thứ resumable từ repo).
- **Cadence:** *tuần* — PM quét board+triggers, retro lesson→rule, kiểm token; *milestone* — refresh NotebookLM, cập nhật RISK-REGISTER; *mỗi lần đau* — một dòng RISK-REGISTER hoặc một án lệ. Hệ này lớn lên bằng sẹo có ghi chép.

## 4. NGUỒN CHÂN LÝ

| Cần biết | Đọc ở đâu |
|---|---|
| Luật chơi (hiến pháp) | `docs/adr/ADR-0001-agent-fleet-coordination.md` |
| Vai PM + án lệ + checklist + exam | `.agents/PM_BOOTSTRAP.md` |
| Rủi ro + tín hiệu sớm | `docs/adr/RISK-REGISTER.md` |
| Trạng thái dự án (duy nhất) | GitHub Issues board |
| Trạng thái phiên local | `.agents/handoff.md`, `.agents/traces/`, `preflight.sh` |
| Khởi động project mới | File này |

## 5. ĐIỀU KIỆN TÁCH TEMPLATE `agent-fleet`

Khi project #2 chạy xong First Light bằng khung copy từ đây (harness không sửa một dòng): tách framework (harness, preflight, new-attempt, dispatch-runner, verifier, superset-check, khung ADR/BOOTSTRAP/RISK-REGISTER, playbook này) ra repo template. Không sớm hơn — tránh đẻ repo non.
