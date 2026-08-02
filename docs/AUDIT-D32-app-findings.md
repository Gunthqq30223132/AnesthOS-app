# AUDIT D32 — Phát hiện phía `AnesthOS-app`

> Trích phần liên quan tới repo này từ bản kiểm toán kiến trúc SR-Agent/AnesthOS.
> Bản đầy đủ (Lớp A–D, 7 cổng, khung AGENTS.md): `SRagent/docs/specs/D32-architecture-audit-blindspots.md`.
> Mọi kết quả dưới đây đo được trên commit hiện tại, không phải suy đoán.

---

## H8 🔴 — Clamp thầm lặng trong `ibw.ts` vi phạm BS-B (lỗi lâm sàng sống)

`src/domain/calculators/ibw.ts:82`

```ts
const inchesOver5Feet = Math.max(0, heightInches - 60);
```

Công thức Devine (1974) không có hiệu lực dưới 5 ft (152.4 cm). `Math.max(0, …)` biến trạng thái
**"đầu vào ngoài vùng áp dụng"** thành **"trả về liều nền 50 kg"**:

| Chiều cao | `calculateIBW` trả về | Đúng ra |
|---|---|---|
| 175 cm | 70.5 kg | 70.5 kg ✅ |
| 140 cm | **50 kg** | ném lỗi |
| 120 cm | **50 kg** | ném lỗi |
| 90 cm | **50 kg** | ném lỗi |
| 50 cm (sơ sinh) | **50 kg** | ném lỗi |
| 1 cm | **50 kg** | ném lỗi |

CLAUDE.md §BS-B viết nguyên văn: *"Never swallow errors, return 0, null, undefined, or clipped
default values when inputs are out of bounds"*. Đây đúng là "clipped default value". Trên một hàm
dùng để tính liều theo cân nặng, với trẻ sơ sinh sai số là **~17 lần**.

Hàm **đi qua đủ cả 5 cổng CI** — không cổng nào nhìn thấy clamp ngữ nghĩa.

**Sửa:**
```ts
const DEVINE_MIN_HEIGHT_CM = 152.4;   // 5 ft — biên dưới hiệu lực của công thức
if (heightCm < DEVINE_MIN_HEIGHT_CM) {
  throw new ClinicalValidationError(
    'HEIGHT_BELOW_FORMULA_DOMAIN',
    `Chiều cao ${heightCm} cm dưới ngưỡng hiệu lực của công thức Devine (${DEVINE_MIN_HEIGHT_CM} cm). ` +
    `Bệnh nhi cần calculator riêng có provenance riêng.`
  );
}
```
Đồng thời siết cận dưới hợp lệ chung (hiện `heightCm = 1` vẫn được chấp nhận).

Liên quan (**L5**): `Math.round(ibwKg * 10) / 10` chạy **trước** khi tính ABW, nên sai số làm tròn
được nhân lên ở bước sau. Chỉ nên làm tròn **một lần**, ở bước hiển thị.

---

## M4 🟠 — `check-boundary.ts` bỏ lọt 8/8 API mà BS-F cấm

Thử nghiệm: đặt một file `src/domain/__probe_boundary.ts` chứa các vi phạm cố ý rồi chạy
`npm run lint:boundary`.

| Vi phạm (BS-F cấm) | Cổng bắt được? |
|---|---|
| `localStorage.getItem(...)` | ❌ lọt |
| `window.innerWidth`, `document.body` | ❌ lọt |
| `new XMLHttpRequest()` | ❌ lọt |
| `new WebSocket(...)` | ❌ lọt |
| `performance.now()` | ❌ lọt |
| `crypto.randomUUID()` | ❌ lọt |
| `const f = fetch; f(url)` (bí danh) | ❌ lọt |
| `const d = Date; new d()` (bí danh) | ❌ lọt |
| `(1234.5).toLocaleString()` (phụ thuộc locale) | ❌ lọt |

Kết quả in ra: `✅ Domain Boundary Validation Passed: src/domain is pure, deterministic, and isolated.`

Nguyên nhân: `check-boundary.ts:109-123` so khớp **văn bản của biểu thức gọi hàm**
(`Date.now`, `Math.random`, `fetch`, `window.fetch`, `globalThis.fetch`, `axios*`). So-khớp-tên
luôn thua bí danh và truy cập gián tiếp.

**Sửa đúng — dùng trình biên dịch thay vì thêm chuỗi cấm.** Cho `src/domain` một tsconfig riêng
**không có `DOM`** trong `lib`:

```jsonc
// src/domain/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022"],          // bỏ "DOM" -> window/document/fetch/localStorage/XHR/WebSocket
    "types": []                 // không kéo @types/node vào domain
  },
  "include": ["**/*.ts"]
}
```

Khi đó mọi API nền tảng trở thành **lỗi biên dịch**, không thể lách bằng bí danh. Giữ
`check-boundary.ts` cho phần type system không diễn đạt được: `Math.random`, `Date.now`,
`new Date()` 0 tham số, và import từ `src/ui`.

Bổ sung nhỏ: glob hiện là `src/domain/**/*.{ts,tsx,js,jsx}` — thêm `mts`/`cts` để không có
đường vòng.

---

## M5 🟠 — CI không chạy trên nhánh mà agent làm việc

`.github/workflows/ci.yml`:

```yaml
on:
  push:
    branches: [ main, develop, 'feat/*' ]
```

Nhánh làm việc của AI Executor là `claude/**` (và `agent/**` theo quy ước worktree của D31 §2).
**Không có nhánh nào trong số đó khớp** ⇒ 5 cổng guardrail không chạy ở đúng nơi rủi ro cao nhất.

**Sửa**: thêm `'claude/**'` và `'agent/**'` vào cả `push` và `pull_request`.

---

## L1 🟡 — Không có cổng nào cưỡng chế BS-C (provenance)

CLAUDE.md yêu cầu *mọi* calculator phải export `ClinicalProvenance`. Hiện việc này chỉ dựa vào kỷ
luật con người. Thêm một test phản chiếu:

- mỗi module trong `src/domain/calculators/**` (trừ `index.ts`) phải export một object khớp
  `ClinicalProvenance`;
- mọi trường bắt buộc khác rỗng;
- `lastReviewedDate` phải phân tích được **và chưa quá hạn rà soát** (đề xuất 24 tháng) —
  guideline hết hạn là rủi ro lâm sàng mà hiện không cổng nào nhìn thấy.

Ghi chú: `ClinicalProvenance` và `ClinicalValidationError` đang được **định nghĩa trùng lặp** bên
trong `ibw.ts`. Nên chuyển ra `src/domain/types.ts` chung trước khi có calculator thứ hai, nếu
không mỗi file sẽ có một biến thể riêng và test phản chiếu ở trên sẽ không có gì chung để bám vào.

---

## L2 🟡 — Ngưỡng coverage 60% quá thấp cho tier CLINICAL

`vitest.config.ts` đặt sàn 60% cho cả 4 chỉ số. Với mã lâm sàng, coverage dòng lệnh nói rất ít —
điều quan trọng là **nhánh biên** (boundary) có được thử hay không. Chính H8 minh hoạ điều đó:
`Math.max(0, …)` là một nhánh có thể đạt 100% line coverage mà không ai từng test chiều cao < 152.4 cm.

**Đề xuất:**
- `src/domain/calculators/**`: sàn **branch ≥ 90%**;
- ràng buộc bổ sung có thể kiểm bằng máy: **mỗi mã `ClinicalValidationError` được ném ra trong
  mã nguồn phải có ít nhất một test khẳng định đúng mã đó** (liệt kê được, nên cưỡng chế được);
- mỗi calculator phải có test tại **biên miền hiệu lực của công thức** (không chỉ biên hợp lệ
  của tham số).

---

## Tái lập

```bash
npm ci
npm run lint:boundary     # PASS ngay cả khi src/domain có file vi phạm cố ý (xem M4)
npx tsx -e "import {calculateIBW} from './src/domain/calculators/ibw'; \
            console.log(calculateIBW({heightCm:50,gender:'male'}))"   # -> ibwKg: 50
```

## Thứ tự đề xuất

1. **M5** trước tiên — không có CI trên nhánh agent thì mọi cổng khác là lý thuyết.
2. **H8** — lỗi lâm sàng sống, sửa kèm test biên.
3. **M4** — chuyển sang cưỡng chế bằng tsconfig.
4. **L1, L2** — cổng provenance + siết coverage nhánh, làm cùng lúc vì cùng đụng cấu hình test.
