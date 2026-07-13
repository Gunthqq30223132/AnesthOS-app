export interface RemoteManifest {
  dataset_version: string;
  hash: string;
  revoked_versions: string[];
  critical_min_version: string;
  max_staleness_hours: number;
  released_at: string;
}

export type GuardAction = 'ALLOW' | 'WARN_UPDATE' | 'BLOCK_REVOKED' | 'BLOCK_STALE' | 'BLOCK_EMERGENCY';

export interface GuardDecision {
  action: GuardAction;
  message: string;
}

const STORAGE_KEYS = {
  REVOKED_VERSIONS: 'anesthos_revoked_versions',
  LAST_CHECK_TIME: 'anesthos_last_check_time',
  LAST_MANIFEST: 'anesthos_last_manifest'
};

export async function evaluateFreshness(
  localVersion: string,
  currentTime: Date = new Date()
): Promise<GuardDecision> {
  // 1. Read cached revoked list from localStorage
  let cachedRevoked: string[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REVOKED_VERSIONS);
    if (stored) {
      cachedRevoked = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse cached revoked versions', e);
  }

  // 2. Immediate Block if localVersion is already revoked in local cache
  if (cachedRevoked.includes(localVersion)) {
    return {
      action: 'BLOCK_REVOKED',
      message: 'Dữ liệu bị thu hồi: Phiên bản này đã bị vô hiệu hóa vì lý do an toàn lâm sàng.'
    };
  }

  // 3. Try online fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout
    const response = await fetch('/manifest.json', { 
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const manifest: RemoteManifest = await response.json();
      
      // Update local storage cache
      localStorage.setItem(STORAGE_KEYS.REVOKED_VERSIONS, JSON.stringify(manifest.revoked_versions));
      localStorage.setItem(STORAGE_KEYS.LAST_CHECK_TIME, currentTime.getTime().toString());
      localStorage.setItem(STORAGE_KEYS.LAST_MANIFEST, JSON.stringify(manifest));

      // Re-check revoked with fresh data
      if (manifest.revoked_versions.includes(localVersion)) {
        return {
          action: 'BLOCK_REVOKED',
          message: 'Dữ liệu bị thu hồi: Phiên bản này đã bị vô hiệu hóa vì lý do an toàn lâm sàng.'
        };
      }

      // Check for emergency updates
      if (isVersionLessThan(localVersion, manifest.critical_min_version)) {
        return {
          action: 'BLOCK_EMERGENCY',
          message: `CẬP NHẬT KHẨN CẤP: Phiên bản của bạn (${localVersion}) cũ hơn phiên bản tối thiểu an toàn (${manifest.critical_min_version}). Vui lòng cập nhật.`
        };
      }

      // Check for normal updates
      if (isVersionLessThan(localVersion, manifest.dataset_version)) {
        return {
          action: 'WARN_UPDATE',
          message: `Nhắc nhở: Có phiên bản dữ liệu mới hơn (${manifest.dataset_version}). Bạn đang dùng (${localVersion}).`
        };
      }

      return {
        action: 'ALLOW',
        message: `Đã xác minh: Dữ liệu lâm sàng mới nhất (${localVersion}).`
      };
    }
  } catch (err) {
    // Fetch failed -> Offline mode execution
    console.warn('Freshness check offline, falling back to cached rules.', err);
  }

  // 4. Offline evaluation logic
  const lastCheckStr = localStorage.getItem(STORAGE_KEYS.LAST_CHECK_TIME);
  if (!lastCheckStr) {
    // Never checked online, block to be safe
    return {
      action: 'BLOCK_STALE',
      message: 'Yêu cầu kết nối mạng: Cần kết nối Internet lần đầu tiên để xác thực dữ liệu lâm sàng.'
    };
  }

  const lastCheckTime = parseInt(lastCheckStr, 10);
  if (isNaN(lastCheckTime)) {
    return {
      action: 'BLOCK_STALE',
      message: 'Dữ liệu xác thực không hợp lệ. Vui lòng kết nối mạng.'
    };
  }

  const msPassed = currentTime.getTime() - lastCheckTime;
  const hoursPassed = msPassed / (1000 * 60 * 60);

  // Retrieve max_staleness from cached manifest, fallback to 24h
  let maxStalenessHours = 24;
  try {
    const cachedManifestStr = localStorage.getItem(STORAGE_KEYS.LAST_MANIFEST);
    if (cachedManifestStr) {
      const cachedManifest: RemoteManifest = JSON.parse(cachedManifestStr);
      maxStalenessHours = cachedManifest.max_staleness_hours;
    }
  } catch (e) {
    // Ignore cache parse error
  }

  if (hoursPassed > maxStalenessHours) {
    return {
      action: 'BLOCK_STALE',
      message: `CHẶN dữ liệu lâm sàng hết hạn: Lần kiểm tra cuối cùng là ${Math.round(hoursPassed)} giờ trước (Giới hạn: ${maxStalenessHours} giờ). Vui lòng kết nối Internet.`
    };
  }

  const lastCheckDate = new Date(lastCheckTime);
  const formattedTime = lastCheckDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = lastCheckDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return {
    action: 'ALLOW',
    message: `Đã xác minh (Offline): Xác thực lần cuối lúc ${formattedTime} ngày ${formattedDate}.`
  };
}

// Basic semantic version comparison: returns true if v1 < v2
function isVersionLessThan(v1: string, v2: string): boolean {
  const parse = (v: string) => v.split(/[-.]/).map(x => {
    const n = parseInt(x, 10);
    return isNaN(n) ? x : n;
  });
  
  const p1 = parse(v1);
  const p2 = parse(v2);
  
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const val1 = p1[i];
    const val2 = p2[i];
    
    if (val1 === undefined) return true;
    if (val2 === undefined) return false;
    
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      if (val1 !== val2) return val1 < val2;
    } else {
      const s1 = String(val1);
      const s2 = String(val2);
      if (s1 !== s2) return s1 < s2;
    }
  }
  return false;
}
