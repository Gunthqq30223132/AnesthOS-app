# PLAYBOOK — Khởi động & vận hành một project mới trên hệ agent-fleet

> Trả lời một câu hỏi duy nhất: **"Tôi (Chủ) bắt đầu một project mới — làm gì, theo thứ tự nào?"**
> Nguồn luật: `docs/adr/ADR-0001` (hiến pháp) · `.agents/PM_BOOTSTRAP.md` (vai PM) · `docs/adr/RISK-REGISTER.md`.
> File này là tiền thân của template `agent-fleet` — tách ra repo riêng khi project #2 chạy xong First Light.
> Viết bởi PM tiền nhiệm (Fable 5) trong cửa sổ chuyển giao 2026-07-19; PM đương nhiệm bảo trì tiếp.

## 0. Bức tranh 30 giây

| Vai | Ai | Làm gì | Không được làm gì |
|---|---|---|---|
| **Chủ** | Bạn | Quyết định cuối, duyệt merge, ký Tier 2, ferry, giữ đề thi | Vá tay thay hệ thống |
| **PM** | Claude auth (Opus 4.8, cloud) | Issue+DoD, spec/ADR, audit bằng chứng, Research Brief | Viết code mình audit; tin báo cáo chưa đối chiếu remote |
| **Antigravity** | IDE local | **Single-writer duy nhất**, điều phối Lính, QC, push/PR | Viết test cho code Tier 2 của chính mình; sửa file PM-owned |
| **Lính** | Model qua 9router (`:20128`) | Trả **patch** theo capsule | Ghi trực tiếp vào tree; nhận việc ngoài tier; đụng `.agents/`, `scripts/`, CI |
| **Gemini** | Chat riêng | Deep research theo Brief | — |
| Kho | GitHub (điều phối+code) · Notion (trải nghiệm) · NotebookLM (lăng kính tra cứu) | | NotebookLM không bao giờ giữ bản duy nhất |

**4 luật xương sống:** ① **Anchor** — mọi báo cáo mở đầu bằng `repo+branch+HEAD+cwd` từ output máy (chuẩn nhất: dán nguyên văn output `preflight.sh` chạy NGAY TRƯỚC khi nộp); ② **Oracle** — kẻ viết code không viết test chấm code đó (Tier ≥2), model yếu không bao giờ sinh expected values, hằng số quan trọng neo văn liệu; ③ **Single-writer** — chỉ Antigravity ghi tree, Lính trả patch, attempt chạy trong worktree riêng; ④ **CI là phán quyết** — local trace là tư vấn, CI giữ gate cứng + Gate 0 so khớp `gates.yml`.

**Chu trình lõi:** `PM ra Issue+DoD → Antigravity gói capsule → Lính trả patch → pre-flight + gates → PR + trace → PM audit → Chủ duyệt → merge → handoff regenerate`.

---

## 1. NGÀY 0 — Khởi tạo project mới (một buổi, 7 bước)

**Bước 1 — Chủ: tạo repo + clone.** Thư mục local **PHẢI trùng tên repo** (rủi ro B5 — vụ `~/projects/AnesthOS` chứa SRagent là nguyên nhân gốc của án lệ 1). Add repo vào scope phiên Claude auth.

**Bước 2 — Chủ: viết 1 trang khai sinh project**, ferry cho PM. Bắt buộc 4 mục: (a) mục tiêu; (b) **vùng rủi ro cao nhất** — cái gì sai thì gây hại thật (người/tiền/pháp lý); (c) chuẩn chất lượng riêng của domain; (d) ràng buộc (hạn chót, ngân sách token, offline?).

**Bước 3 — PM: khai INSTANCE** (đây là toàn bộ phần "framework cần biết về project"):
- **Tier map:** vùng nào là Tier 3 (`scripts/`, `.agents/`, CI — mặc định), Tier 2 (critical của project — do mục (b) quyết định), Tier 1, Tier 0.
- **Bộ gate chuẩn** — lệnh thật của project (build/test/lint/secret-scan/coverage…) ghi vào `.agents/gates.yml`, label `project:` đúng tên repo.
- **`tier_top_verify`** — gate verify của tier đỉnh (kiểu Numeric Firewall). **Chưa có gate này thì vùng Tier 2 ĐÓNG BĂNG với Lính** (bài học F1 của AnesthOS).
- **DoD theo tier** (khung ADR §5, điền lệnh cụ thể).
→ Tất cả thành một commit + một phụ lục instance ngắn trong `docs/adr/`.

**Bước 4 — Antigravity: bê khung từ reference implementation** (`anesthos-app`, branch `claude/adr-0001-agent-fleet`):
- Copy **không sửa**: `scripts/agent-qc-harness.py` (nếu phải sửa mới chạy được = bug framework, báo PM chứ không tự vá), `.agents/preflight.sh`, `scripts/check_gates_superset.py`.
- Điền instance: `.agents/gates.yml` (bước 3), thêm entry project mới vào `REQUIRED_GATES`, wire **Gate 0** (superset check) + các gate chuẩn vào CI workflow.
- Copy khung tài liệu: `docs/adr/ADR-0001` (tham chiếu hoặc copy), `.agents/PM_BOOTSTRAP.md`, `docs/adr/RISK-REGISTER.md` (giữ nhóm rủi ro chung, thêm nhóm rủi ro riêng của domain).

**Bước 5 — Antigravity: chạy nghiệm thu đầu tiên.** `preflight.sh` (anchor + 9router + model pin + gh + tree) → harness full → trace xanh đầu tiên → push → báo cáo có anchor.

**Bước 6 — PM: mở board.** GitHub Issues, prefix `[<Mã>-M0-xx]`. M0 luôn kết thúc bằng issue **First Light**.

**Bước 7 — FIRST LIGHT của project mới.** Một task NHÁP đi trọn chu trình lõi, **zero vá tay**, lưu trace từng bước, retro 30 phút. **Chỉ khi First Light xanh, project mới được coi là "sẵn sàng phát triển".** Setup xong ≠ sẵn sàng — đường ống chưa từng dẫn nước là đường ống chưa tồn tại.

---

## 2. VÒNG ĐỜI MỘT TASK (vận hành thường ngày)

1. **PM ra Issue**: DoD checklist theo tier + danh sách **giả định** (assumptions). Không Issue = không có task.
2. **Antigravity nhận** (`gh issue list`), chạy `preflight.sh`, quyết định route theo bảng tier (ADR §4): Gemma local → input-fixtures/fuzz/format (việc mà output sai rẻ-để-vứt); Haiku → Tier 0–1; model mạnh nhất đã xác minh trên kênh → Tier 2. Model ID pin, không trôi.
3. **Gói capsule** spec-only: signature + docstring + ví dụ + acceptance test. Không dump repo. Không gửi nội dung Tier 3 hay file đang viết dở lên cloud.
4. **Lính trả patch** → pre-flight: `git apply --check` → path-guard (chạm vùng cấm = chết ngay) → secret-scan patch → typecheck. Rồi harness chạy gates trên snapshot, ghi trace.
5. **Fail thì leo thang có trần:** 2 attempt/nấc: Gemma → Haiku/model mạnh → Antigravity tự sửa → **PM xét lại spec** (fail xuyên 3 tầng thường là spec sai) → Chủ (nhận 2 phương án kèm trade-off, không nhận stack trace). Kẻ sửa code không đụng test đang fail; kẻ sửa test không đụng code. Đóng băng = Escalation Bundle + cây chính sạch.
6. **Antigravity tích hợp** (single-writer), push branch, mở PR, **đính trace** (`base_sha` khớp HEAD).
7. **PM audit** theo checklist BOOTSTRAP §3–§4: đối chiếu remote TRƯỚC khi đọc văn; DoD từng mục; nghi vấn Oracle; hằng số Tier 2 verify văn liệu (PubMed); coverage không giảm.
8. **Chủ duyệt** (visual Tier 1; ký Tier 2) → merge → đóng Issue → `handoff.md` regenerate từ state (≤60 dòng, cấm tail-cut). Có vết vá tay? → retro → lesson→rule (thành commit, không thành note).

## 3. NGHI THỨC MỖI PHIÊN

- **PM** (BOOTSTRAP §1): đọc ADR → quét trigger RISK-REGISTER → board → handoff. Chat cũ = không tin cậy.
- **Antigravity**: chạy `preflight.sh` đầu phiên; **anchor của mọi báo cáo = output preflight dán nguyên văn ở bước cuối trước khi nộp** (đã 3 lần dính lỗi anchor gõ tay/anchor cũ). Báo cáo luôn kết bằng mục "BẤT KHẢ THI / RỦI RO / TÔI KHÔNG ĐỒNG Ý".
- **Chủ**: chỉ ferry con trỏ (link Issue/branch/file), không ferry nội dung dài — "chat trỏ, repo chứa".

## 4. KHI GẶP ẨN SỐ — pipeline research

Giả định trong Issue vỡ (gate fail lặp, estimate nổ, ẩn số mới) → PM viết **Research Brief** (câu-hỏi-quyết-định + facts cần chính xác cao + format output) → Chủ ferry Gemini → Gemini trả: tóm tắt 80/20 + bảng `claim→nguồn→độ tin` + mục **"đã lược bỏ"** → PM chỉ verify claim quyết định → bản full vào Notion/NotebookLM, bản chưng cất + link vào `docs/research/` hoặc Issue. Research không có địa chỉ = research sẽ phải mua lại.

## 5. KHI CÓ SỰ CỐ — chế độ suy giảm

Quét cột "Tín hiệu sớm" của RISK-REGISTER. Mất Ollama → route cloud. Mất kênh Kiro (coi chừng A2 — hack OAuth vỡ im lặng; heartbeat probe 15') → Antigravity tự code, PM audit dày. Mất PM cloud → Chủ vận hành tay bằng checklist §3/§4. Chủ vắng → hệ **đứng im an toàn** (không auto-merge, mọi thứ resumable từ repo) — đứng im không phải sự cố.

## 6. CADENCE

- **Mỗi tuần:** PM quét board + triggers; retro lesson→rule; kiểm chi phí token (kênh Kiro cõng ~6.3k prompt tokens overhead/call — việc nhỏ đừng đi cửa đắt).
- **Mỗi milestone:** refresh nguồn NotebookLM; cập nhật RISK-REGISTER; xem lại `lastReviewedDate` của dữ liệu có provenance.
- **Mỗi lần đau:** một dòng mới trong RISK-REGISTER hoặc một án lệ trong BOOTSTRAP — hệ này lớn lên bằng sẹo có ghi chép.

## 7. NGUỒN CHÂN LÝ

| Cần biết gì | Đọc ở đâu |
|---|---|
| Luật chơi (hiến pháp) | `docs/adr/ADR-0001-agent-fleet-coordination.md` |
| Cách làm PM + án lệ + checklist + exam | `.agents/PM_BOOTSTRAP.md` |
| Rủi ro + tín hiệu sớm | `docs/adr/RISK-REGISTER.md` |
| Trạng thái dự án (duy nhất) | GitHub Issues board |
| Trạng thái phiên local | `.agents/handoff.md`, `.agents/traces/`, output `preflight.sh` |
| Khởi động project mới | File này |

## 8. ĐIỀU KIỆN TÁCH TEMPLATE `agent-fleet`

Khi project #2 chạy xong First Light bằng bộ khung copy từ đây (harness không sửa một dòng): tách framework (harness, preflight, superset-check, ADR khung, BOOTSTRAP khung, RISK-REGISTER khung, playbook này) ra repo template. Không sớm hơn — tránh đẻ repo non.
