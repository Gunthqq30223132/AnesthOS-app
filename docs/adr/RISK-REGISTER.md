# RISK-REGISTER — Sổ rủi ro toàn vòng đời hệ agent-fleet

> Chuẩn PMI rút gọn cho đội 1-người-nhiều-agent. Mỗi rủi ro: phát biểu *nguyên nhân → sự kiện → tác động*,
> xác suất/tác động (C=cao, T=trung, Th=thấp), chiến lược, chủ sở hữu, **tín hiệu sớm** (PM quét mỗi phiên),
> kế hoạch đáp ứng. Cập nhật qua PR như mọi tài liệu khác. Trạng thái: 2026-07-18, cửa sổ chuyển giao PM.

## Nhóm A — Model & kênh

| ID | Rủi ro | P/I | Chiến lược & kế hoạch đáp ứng | Owner | Tín hiệu sớm |
|---|---|---|---|---|---|
| A1 | **[ĐANG XẢY RA]** Mất Fable 5, PM chuyển sang Opus 4.8 → mất ký ức thể chế + phán đoán tích luỹ, KHÔNG phải mất IQ | C/C | Mitigate: `PM_BOOTSTRAP.md` (luật + án lệ + checklist) + succession exam §9; mọi phán đoán lặp lại được → biên dịch thành checklist/code | PM + Chủ | Successor trả lời không trích được điều khoản ADR; nới luật không dẫn án lệ |
| A2 | Hack OAuth của Kiro (API key giả dạng oauth, `expiresAt: 2030`) vỡ khi 9router/Kiro đổi schema → kênh Lính-mạnh chết im lặng | C/C | Mitigate: smoke test model pin trong preflight mỗi phiên làm việc; Accept phần còn lại (hack là tạm). Fallback: Antigravity tự code + PM audit dày | Antigravity | 401/`expired` trong log 9router; latency bất thường |
| A3 | Model ID trôi tự do (đã thấy 3 lần: Opus 4.8→Haiku→sonnet-4.5-thinking) → chất lượng đổi mà không ai quyết | T/C | Avoid: pin model ID trong config (M1-02); mọi đổi model là một PR, không phải một sự tình cờ | Antigravity | Transcript có model khác config |
| A4 | Ollama trên M4 16GB: model 9.6GB + KV cache → swap, treo IDE, hoặc content rỗng (đã thấy) | C/T | Mitigate: bản quantized, `keep_alive`, serialize 1 inference, timeout + fallback cloud (M1-02) | Antigravity | Load >10s; `finish_reason: length`; RAM áp trần |

## Nhóm B — Context & tri thức

| ID | Rủi ro | P/I | Chiến lược & kế hoạch đáp ứng | Owner | Tín hiệu sớm |
|---|---|---|---|---|---|
| B1 | Session chat chết bất kỳ lúc nào → tri thức chưa externalize bốc hơi | C/C | Avoid: repo là nguồn thật duy nhất; "chat trỏ, repo chứa"; nghi thức khởi động phiên (BOOTSTRAP §1) | Mọi actor | Quyết định quan trọng chỉ tồn tại trong chat >1 ngày |
| B2 | Framework "fork trong chat": nhiều phiên/nhiều model hiểu luật hơi khác nhau → trôi dần | T/C | Avoid: thay đổi luật CHỈ có hiệu lực khi thành commit vào ADR; lời nói không sửa được hiến pháp | PM | Hai báo cáo viện dẫn cùng luật với nội dung khác nhau |
| B3 | Notion/NotebookLM ôi (nguồn cũ) → Chủ quyết định trên thông tin stale | T/T | Mitigate: refresh nguồn sau mỗi milestone; NotebookLM không bao giờ là bản duy nhất | Chủ | Trích dẫn tài liệu không còn khớp repo |
| B4 | `handoff.md` hỏng (đã suýt: tail-100 chặt frontmatter) | T/T | Avoid: regenerate-từ-state (ADR §8), M1-05 | Antigravity | File mất frontmatter |
| B5 | Thư mục local tên lệch repo (`~/projects/AnesthOS` đang chứa clone SRagent) → actor đứng trong đó tự nhầm danh tính project — **nguyên nhân gốc của án lệ 1** | C/T | Avoid: đổi tên thư mục khớp tên repo; preflight in anchor mỗi phiên; label `project:` khớp repo (M1-04) | Chủ + Antigravity | Anchor có `cwd` ≠ tên repo |

## Nhóm C — Quy trình & an ninh

| ID | Rủi ro | P/I | Chiến lược & kế hoạch đáp ứng | Owner | Tín hiệu sớm |
|---|---|---|---|---|---|
| C1 | Báo cáo tự-nhầm/sai nhãn (đã xảy ra 2 lần) → PM quyết trên thông tin sai | C/C | Mitigate: Luật Anchor + checklist nghiệm thu (BOOTSTRAP §3) chạy máy móc mọi báo cáo | PM | Báo cáo thiếu anchor, thiếu output máy |
| C2 | `gates.yml`/gate local bị rút răng bởi patch (vô tình hoặc không) → xanh giả | T/C | Avoid: CI không đọc gates.yml + bước CI so khớp superset (M1-08); patch Lính chạm Tier-3 path auto-reject | Antigravity + PM | Diff chạm `.agents/`, `scripts/`, CI |
| C3 | Secret leak lên remote (ĐÃ XẢY RA: key gateway 2026-07-18) | T/C | Mitigate: rotate + env var + pattern mở rộng (M1-01); pre-push fail-closed; PM grep diff mỗi audit | Antigravity | Bất kỳ literal `sk-`/`Bearer` trong diff |
| C4 | Automation tăng → single-writer vỡ trở lại (nhiều subagent cùng ghi) | T/C | Avoid: ADR §7 (worktree + CAS + watcher chỉ-đọc) phải thành CODE trong harness (M1-08), không nằm ở văn bản | Antigravity | Conflict/`stale` trace xuất hiện thường xuyên |
| C5 | Luật Oracle vỡ kiểu mới: fixer sửa test cho khớp code sai | T/C | Avoid: path-check trong harness — fixer không đụng test đang fail (M1-08); PM soi PR sửa test+code cùng tác giả | Antigravity + PM | PR đổi expected value không kèm citation |
| C6 | **"Vá tay tạm thời" thành văn hoá**: First Light chưa đạt zero-manual nhưng cả đội quen dần với nửa-tự-động | C/T | Mitigate: định nghĩa First Light là ZERO vá tay (M1-07 DoD); retro bắt buộc; mỗi lần vá tay = 1 lesson→rule | Chủ + PM | "Lần này sửa tay cho nhanh" xuất hiện lần thứ 2 |
| C7 | APFS case-insensitive: import sai hoa/thường pass ở local Mac, vỡ trên Linux CI *(nguồn: Antigravity, vòng 3)* | T/T | Mitigate: CI là phán quyết (§6.1); bật `forceConsistentCasingInFileNames` trong tsconfig | Antigravity | CI đỏ module-not-found chỉ trên Linux |
| C8 | Guard máy móc bắn nhầm vào fixture-có-chủ-đích (đề thi, test case chứa mẫu secret) → executor "sửa" phá artifact của người khác — **ĐÃ XẢY RA 2026-07-19** | T/T | Avoid: file PM-owned chỉ PM ghi (ADR §9.7); guard fail → báo cáo, không tự sửa ngoài phạm vi mình sở hữu | Mọi actor | Diff chạm file không thuộc quyền sở hữu của tác giả commit |

## Nhóm D — Con người (điểm nghẽn thật của hệ)

| ID | Rủi ro | P/I | Chiến lược & kế hoạch đáp ứng | Owner | Tín hiệu sớm |
|---|---|---|---|---|---|
| D1 | Chủ là single point of failure (bác sĩ GMHS, lịch trực, quá tải) → hệ rớt nhịp rồi chết mòn | C/C | Mitigate: hệ **chịu-dừng có chủ đích** — không auto-merge, mọi trạng thái resumable từ repo; đứng im ≠ sự cố. Cadence tuần tối thiểu 1 phiên PM | Chủ | Board không nhúc nhích >2 tuần mà không có quyết định dừng chủ động |
| D2 | Approval fatigue: vòng lặp nhanh dần → Chủ duyệt theo quán tính, chữ ký lâm sàng mất giá trị | T/C | Mitigate: chỉ Tier 2+ cần đọc sâu; batch duyệt; PM tóm tắt diff thành "điều duy nhất cần bạn nhìn" | PM | Thời gian duyệt trung bình giảm bất thường |
| D3 | Ferry sai/stale (Chủ dán nhầm phiên bản prompt/báo cáo giữa các chat) | T/T | Mitigate: chat trỏ, repo chứa — prompt tham chiếu file/branch/Issue, không kể lại nội dung | Chủ | Hai bên viện dẫn nội dung khác nhau của "cùng một tài liệu" |

## Nhóm E — Hạ tầng & tài chính

| ID | Rủi ro | P/I | Chiến lược & kế hoạch đáp ứng | Owner | Tín hiệu sớm |
|---|---|---|---|---|---|
| E1 | Máy M4 chết / sqlite 9router hỏng → dựng lại mất nhiều ngày, mất cấu hình | Th/C | Mitigate: script tái tạo đã có (`setup_9router_credentials.py`); bổ sung: backup định kỳ `~/.9router` (TRỪ secrets) + ghi RTO mục tiêu (nửa ngày) vào runbook | Antigravity | — |
| E2 | Token runaway: retry loop + overhead ~6.3k tokens/call kênh Kiro × automation | T/C | Mitigate: budget đa chiều persist (ADR §7.6) phải thành code; đo cost/task từ trace | Antigravity | Hoá đơn tuần tăng >2× không kèm tăng task |
| E3 | Backup SSD/iCloud fail im lặng (script hiện chỉ `echo` cảnh báo rồi đi tiếp) | T/T | Mitigate: backup fail → exit code ≠ 0 + hiện trong build_status (M1-05) | Antigravity | Ngày backup cuối > 7 ngày |
| E4 | Mac sleep/PowerNap đình chỉ daemon (9router, watcher) → socket đứt, sqlite treo im lặng khi thức dậy *(nguồn: Antigravity, vòng 3)* | C/T | Mitigate: heartbeat probe 15' + cờ `DEGRADED_KIRO_AUTH_FAIL` vào handoff (đề xuất đã DUYỆT — đồng thời là early-warning cho A2); launchd `KeepAlive` | Antigravity | Preflight fail ngay sau khi máy ngủ dậy |
| E5 | Antigravity IDE self-update đổi môi trường ngầm (sandbox, env subagent, symlink) *(nguồn: Antigravity, vòng 3)* | T/T | Mitigate: preflight in version IDE + node; pin version khi có thể | Antigravity | Hành vi đổi ngay sau ngày IDE update |
| E6 | Mở 2 workspace song song → tranh chấp port `:20128` / SQLite lock `~/.omniroute` *(nguồn: Antigravity, vòng 3)* | T/T | Mitigate: lockfile; quy ước 1 workspace active; lỗi lock → dừng, không retry mù | Chủ | `database is locked` / `EADDRINUSE` |
| E7 | Daemon nền thiếu `PATH` chứa node/nvm → bridge sub-process của 9router chết im lặng (`env: node: No such file`) *(nguồn: Antigravity, vòng 3 — đã gặp thật)* | T/T | Avoid: launchd plist export PATH tường minh tới binary node; ghi vào runbook | Antigravity | 9router sống nhưng provider bridge chết |

## Nhóm F — Lâm sàng (instance AnesthOS — tác động cao nhất toàn hệ)

| ID | Rủi ro | P/I | Chiến lược & kế hoạch đáp ứng | Owner | Tín hiệu sớm |
|---|---|---|---|---|---|
| F1 | **[GAP ĐANG MỞ]** Hằng số lâm sàng sai lọt 5 gate (test cùng tác giả tự khớp) — `tier_top_verify` cho anesthos-app **CHƯA TỒN TẠI** | T/**RẤT CAO** | Avoid: Numeric Firewall TS = ưu tiên #1 của M2, TRƯỚC mọi feature lâm sàng mới; đến lúc đó `src/domain` đóng băng với Lính | PM + Antigravity | Bất kỳ PR nào chạm `src/domain` trước khi gate này tồn tại |
| F2 | Provenance ôi: `lastReviewedDate` già đi, guideline đổi phiên bản mà không ai review lại | C/T | Mitigate: gate nhắc chu kỳ review (12 tháng); PM verify PubMed khi audit Tier 2 | Chủ + PM | `lastReviewedDate` > 12 tháng |

## Cách dùng sổ này

- PM quét cột **Tín hiệu sớm** trong nghi thức khởi động phiên (BOOTSTRAP §1.2).
- Rủi ro mới phát hiện → thêm dòng qua PR, kèm án lệ nếu có (lesson→rule §11 ADR).
- Rủi ro đã kích hoạt → chuyển thành Issue, ghi ngày + link vào cột kế hoạch đáp ứng.
