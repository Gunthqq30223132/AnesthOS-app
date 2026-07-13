import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateFreshness } from '../src/ui/services/freshnessGuard';
import fs from 'fs';
import path from 'path';

// Mock LocalStorage for Node.js environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const localStorageMock = new LocalStorageMock();
globalThis.localStorage = localStorageMock as unknown as Storage;

describe('Hạng mục 2: freshnessGuard Decision Table & Version Kill-Switch Test', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('Nhánh 1: block vĩnh viễn nếu version local nằm trong danh sách revoked_versions (Cache Local)', async () => {
    localStorageMock.setItem('anesthos_revoked_versions', JSON.stringify(['0.9.0', '0.9.5-beta']));
    
    // Evaluate offline / local checks first
    const decision = await evaluateFreshness('0.9.0', new Date());
    expect(decision.action).toBe('BLOCK_REVOKED');
    expect(decision.message).toContain('Dữ liệu bị thu hồi');
  });

  it('Nhánh 2a: Online, version local là revoked_versions mới nhất từ server', async () => {
    const mockManifest = {
      dataset_version: '1.1.0',
      hash: 'abc',
      revoked_versions: ['0.9.9'],
      critical_min_version: '1.0.0',
      max_staleness_hours: 24,
      released_at: new Date().toISOString()
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockManifest
    } as Response);

    const decision = await evaluateFreshness('0.9.9', new Date());
    expect(decision.action).toBe('BLOCK_REVOKED');
    expect(decision.message).toContain('Dữ liệu bị thu hồi');
    expect(localStorageMock.getItem('anesthos_revoked_versions')).toBe(JSON.stringify(['0.9.9']));
  });

  it('Nhánh 2b: Online, version local < critical_min_version (Cập nhật khẩn cấp)', async () => {
    const mockManifest = {
      dataset_version: '1.2.0',
      hash: 'abc',
      revoked_versions: [],
      critical_min_version: '1.1.0',
      max_staleness_hours: 24,
      released_at: new Date().toISOString()
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockManifest
    } as Response);

    const decision = await evaluateFreshness('1.0.5', new Date());
    expect(decision.action).toBe('BLOCK_EMERGENCY');
    expect(decision.message).toContain('CẬP NHẬT KHẨN CẤP');
  });

  it('Nhánh 2c: Online, version local < dataset_version (Nhắc nhở cập nhật thông thường)', async () => {
    const mockManifest = {
      dataset_version: '1.2.0',
      hash: 'abc',
      revoked_versions: [],
      critical_min_version: '1.0.0',
      max_staleness_hours: 24,
      released_at: new Date().toISOString()
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockManifest
    } as Response);

    const decision = await evaluateFreshness('1.1.0', new Date());
    expect(decision.action).toBe('WARN_UPDATE');
    expect(decision.message).toContain('Nhắc nhở: Có phiên bản dữ liệu mới hơn');
  });

  it('Nhánh 2d: Online, version local === dataset_version (Được phép chạy)', async () => {
    const mockManifest = {
      dataset_version: '1.2.0',
      hash: 'abc',
      revoked_versions: [],
      critical_min_version: '1.0.0',
      max_staleness_hours: 24,
      released_at: new Date().toISOString()
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockManifest
    } as Response);

    const decision = await evaluateFreshness('1.2.0', new Date());
    expect(decision.action).toBe('ALLOW');
    expect(decision.message).toContain('Đã xác minh: Dữ liệu lâm sàng mới nhất');
  });

  it('Nhánh 3: Offline, thời gian từ lần check cuối cùng còn trong hạn max_staleness (Cho phép)', async () => {
    // Giả lập offline (fetch ném lỗi)
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const now = new Date('2026-07-13T12:00:00Z');
    const lastCheck = new Date('2026-07-13T10:00:00Z'); // 2 tiếng trước (< 24 tiếng)

    localStorageMock.setItem('anesthos_last_check_time', lastCheck.getTime().toString());
    localStorageMock.setItem('anesthos_last_manifest', JSON.stringify({ max_staleness_hours: 24 }));

    const decision = await evaluateFreshness('1.0.0', now);
    expect(decision.action).toBe('ALLOW');
    expect(decision.message).toContain('Đã xác minh (Offline)');
  });

  it('Nhánh 4: Offline, quá hạn max_staleness (Chặn tính toán)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const now = new Date('2026-07-13T12:00:00Z');
    const lastCheck = new Date('2026-07-12T10:00:00Z'); // 26 tiếng trước (> 24 tiếng)

    localStorageMock.setItem('anesthos_last_check_time', lastCheck.getTime().toString());
    localStorageMock.setItem('anesthos_last_manifest', JSON.stringify({ max_staleness_hours: 24 }));

    const decision = await evaluateFreshness('1.0.0', now);
    expect(decision.action).toBe('BLOCK_STALE');
    expect(decision.message).toContain('CHẶN dữ liệu lâm sàng hết hạn');
  });
});

describe('Hạng mục 1: Bundle Size and Precache Verification', () => {
  it('đảm bảo bundle build không chứa các file JSON nạp tĩnh (Kích thước bundle size < 200KB)', () => {
    const assetsDir = path.resolve(__dirname, '../dist/assets');
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      jsFiles.forEach(jsFile => {
        const stats = fs.statSync(path.join(assetsDir, jsFile));
        const sizeKb = stats.size / 1024;
        expect(sizeKb).toBeLessThan(200); // 200KB threshold
      });
    }
  });

  it('đảm bảo thư mục public/data/ chứa đủ 22 file JSON lâm sàng', () => {
    const publicDataDir = path.resolve(__dirname, '../public/data');
    expect(fs.existsSync(publicDataDir)).toBe(true);
    const files = fs.readdirSync(publicDataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    expect(jsonFiles.length).toBe(23); // 22 rulesets + 1 provenance manifest
  });
});
