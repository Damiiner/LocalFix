export const SESSION_KEY = "localfix-session-v5";
const LEGACY_KEYS = ["localfix-session-v4", "localfix-demo-v3", "localfix-demo-v2"];

/** App state for the current browser tab (sessionStorage). */
export function loadPersistedState() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.v === 5) return normalizePayload(data);
    }
    for (const key of LEGACY_KEYS) {
      const legacyRaw = sessionStorage.getItem(key);
      if (!legacyRaw) continue;
      const data = JSON.parse(legacyRaw);
      if (data && (data.v === 4 || data.v === 5)) {
        return normalizePayload({ ...data, v: data.v === 5 ? 5 : 4 });
      }
    }
    return null;
  } catch {
    return null;
  }
}

function normalizePayload(data) {
  return {
    ...data,
    auditLog: Array.isArray(data.auditLog) ? data.auditLog : [],
    offlineQueue: Array.isArray(data.offlineQueue) ? data.offlineQueue : [],
    userRatings: Array.isArray(data.userRatings) ? data.userRatings : []
  };
}

export function savePersistedState(payload) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ v: 5, ...payload }));
  } catch {
    void 0;
  }
}

export function clearPersistedState() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    LEGACY_KEYS.forEach((k) => sessionStorage.removeItem(k));
    localStorage.removeItem("localfix-demo-v3");
    localStorage.removeItem("localfix-demo-v2");
  } catch {
    void 0;
  }
}
