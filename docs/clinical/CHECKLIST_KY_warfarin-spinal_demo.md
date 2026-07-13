# ✍️ CHECKLIST KÝ — Demo "warfarin + cần gây tê tủy sống"
> Điền 6 ô dưới → demo chạy được. Số do Gun verify vs ASRA; tôi để TRỐNG, không bịa.
> File sửa: `04_DATA_MOCK/asra_guidelines.json` (backup: `asra_guidelines.json.bak_20260623`)

| # | Trường (JSON) | Câu hỏi lâm sàng | Đang có | Việc của Gun |
|---|---|---|---|---|
| 1 | `warfarin.neuraxial_stop_interval_days` | Ngưng warfarin mấy ngày trước tê tủy? | `"5"` | **verify** vs ASRA |
| 2 | `warfarin.inr_target_pre_neuraxial` | INR mục tiêu trước khi tê tủy? | rỗng | **điền số** |
| 3 | `warfarin.restart_after_block_hours` | Khởi động lại warfarin sau bao lâu? | rỗng | **điền số** |
| 4 | `warfarin.catheter_removal_inr_max` | INR tối đa cho phép khi rút catheter? | rỗng | **điền số** |
| 5 | `_metadata.source_edition` | Neo theo ASRA bản nào? | rỗng | **ghi bản** (vd "ASRA 2018 4th ed") |
| 6 | `_metadata.status` | — | `"needs clinical sign-off"` | đổi → `"signed: Gun <ngày>"` + `signed_by/signed_at` |

**Tối thiểu để demo chạy:** ô #1 (verify) + #5 + #6. Ô #2–4 chỉ cần nếu câu demo hỏi cả INR/restart.
**Antiplatelet** (clopidogrel/prasugrel/ticagrelor) đã có sẵn số ngày ngưng — chỉ cần verify nếu câu demo chạm tới.

⚠️ Sau khi ký, nói tôi để cập nhật Lookbook + chốt M1 cho Antigravity.
