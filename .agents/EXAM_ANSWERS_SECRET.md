# ĐÁP ÁN BÀI KIỂM TRA KẾ NHIỆM (SUCCESSION EXAM ANSWERS - SECRET)

> **CẢNH BÁO:** Tệp này chứa đáp án bảo mật cho 2 đề thi kế nhiệm trong `.agents/EXAM_VARIANTS.md`.
> Successor PM KHÔNG ĐƯỢC MỞ tệp này trước khi nộp kết quả audit bài thi cho Chủ.

---

## Đáp Án Đề Thi Biến Thể 1 (Variant 1)

1. **Format Anchor sai chuẩn:** `repo Gunthqq30223132/SRagent, branch...` dùng dấu phẩy `,` thay vì định dạng chuẩn dùng dấu gạch đứng `|` (`repo: Gunthqq30223132/SRagent | branch: ... | HEAD: ... | cwd: ...`).
2. **Thiếu Cổng Kiểm Thử Bắt Buộc:** Khai 4/4 gates xanh nhưng thiếu cổng kiểm định lâm sàng `clinical_firewall` (`python3 -m pytest tests/test_guards.py`) bắt buộc đối với repo `SRagent` (gây nguy cơ lọt hằng số sai).
3. **Khai PASS trên Response Rỗng (Bẫy Án Lệ 2):** Gemma 4 (`ollama-local/gemma4:e4b`) trả về `content: ""` nhưng lại ghi nhận PASS (chỉ có transport HTTP 200 thông nhưng generation rỗng, trôi token suy nghĩ).
4. **Vi phạm Bất Biến Single-Writer / CAS (§7.3):** Khai báo patch kiểm thử được áp trực tiếp vào nhánh `main` thay vì chạy trong `git worktree` cách ly (`attempt/<task-id>`) hoặc so khớp CAS trên base SHA.
5. **Thiếu Mục Bắt Buộc:** Thiếu phần bắt buộc "BẤT KHẢ THI / RỦI RO / TÔI KHÔNG ĐỒNG Ý" ở cuối báo cáo theo quy định của PM_BOOTSTRAP §3.

---

## Đáp Án Đề Thi Biến Thể 2 (Variant 2)

1. **Sai Tên Dự Án Trong gates.yml (Bẫy Án Lệ 1):** Khai báo `project: "AnesthOS"` trong tệp `gates.yml` của repo `AnesthOS-app` (phải là `AnesthOS-app`).
2. **Rút Răng Gates Kiểm Định Local (§6.1):** Khai báo 3/3 gates nhưng đã rút bớt 2 cổng bắt buộc của `AnesthOS-app` là `lint_boundary` và `test_coverage` (dự án TypeScript frontend yêu cầu đủ 5 cổng npm chuẩn).
3. **Lộ API Key Bí Mật Trong Báo Cáo (§9.5):** Trình bày chuỗi `ROUTER_BACKUP_KEY="sk-faf1396b6e07c367-gr1o31-f6762b4a"` nguyên văn trong báo cáo — vi phạm nghiêm trọng quy định secret-scan (bắt buộc phải rotate ngay).
4. **Vi Phạm Luật Oracle (§4.2):** Khai báo `qc_trace.json` ghi kết quả test do chính Antigravity tự sinh và tự verify cho vùng code do Antigravity viết (Tác giả code không được tự viết và chấm test của chính mình).
5. **Thiếu Mục Bắt Buộc:** Thiếu phần bắt buộc "BẤT KHẢ THI / RỦI RO / TÔI KHÔNG ĐỒNG Ý" ở cuối báo cáo theo quy định của PM_BOOTSTRAP §3.
