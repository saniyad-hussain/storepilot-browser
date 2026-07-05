/**
 * StorePilot Access Hub - shared helpers.
 *
 * SECURITY:
 * - Only the extension token (never passwords) is stored in chrome.storage.local.
 * - No browsing history, cookies, or keystrokes are ever read.
 */

/** Read the saved connection settings. */
export async function getSettings() {
  const data = await chrome.storage.local.get([
    "apiBaseUrl",
    "token",
    "installId",
    "deviceName",
    "storeId",
    "storeIds",
  ]);
  const storeIds = data.storeIds
    ? data.storeIds
    : data.storeId
    ? [data.storeId]
    : [];
  return {
    apiBaseUrl: data.apiBaseUrl || "",
    token: data.token || "",
    installId: data.installId || "",
    deviceName: data.deviceName || "",
    storeId: data.storeId || "",
    storeIds,
  };
}

/** Persist connection settings. */
export async function saveSettings(settings) {
  await chrome.storage.local.set(settings);
}

/** Ensure a stable random install id exists for this browser profile. */
export async function ensureInstallId() {
  const { installId } = await chrome.storage.local.get("installId");
  if (installId) return installId;
  const id = crypto.randomUUID().replace(/-/g, "");
  await chrome.storage.local.set({ installId: id });
  return id;
}

/** Call the StorePilot API with the stored bearer token. */
export async function apiFetch(path, options = {}) {
  const { apiBaseUrl, token } = await getSettings();
  if (!apiBaseUrl || !token) {
    throw new Error("Not connected. Open the extension options to connect.");
  }
  const base = apiBaseUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response.
  }
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

/** Send a device heartbeat (updates lastSeenAt). Silently ignores failures. */
export async function sendHeartbeat() {
  try {
    const installId = await ensureInstallId();
    await apiFetch("/api/extension/device-heartbeat", {
      method: "POST",
      body: JSON.stringify({ extensionInstallId: installId }),
    });
  } catch {
    // Heartbeat failures are non-fatal (offline, not yet registered, etc.)
  }
}
