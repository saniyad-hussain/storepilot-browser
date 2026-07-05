/**
 * StorePilot Access Hub - options page.
 * Stores the API base URL and connection token (chrome.storage.local),
 * loads the workspace + store list, and registers this device/PC.
 */
import { apiFetch, ensureInstallId, getSettings, saveSettings } from "./shared.js";

const els = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  token: document.getElementById("token"),
  deviceName: document.getElementById("deviceName"),
  storeSelect: document.getElementById("storeSelect"),
  connectBtn: document.getElementById("connectBtn"),
  syncBtn: document.getElementById("syncBtn"),
  status: document.getElementById("status"),
  workspaceInfo: document.getElementById("workspaceInfo"),
  workspaceName: document.getElementById("workspaceName"),
  subscriptionStatus: document.getElementById("subscriptionStatus"),
};

function setStatus(message, ok) {
  els.status.textContent = message;
  els.status.className = `status ${ok ? "ok" : "err"}`;
  els.status.hidden = false;
}

function populateStores(stores, selectedId) {
  els.storeSelect.innerHTML = "";
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "— No store assigned —";
  els.storeSelect.appendChild(noneOpt);
  for (const store of stores) {
    const opt = document.createElement("option");
    opt.value = store.id;
    opt.textContent = store.name;
    if (store.id === selectedId) opt.selected = true;
    els.storeSelect.appendChild(opt);
  }
}

/** Fetch bootstrap data and update workspace/store UI. */
async function sync({ silent = false } = {}) {
  try {
    const installId = await ensureInstallId();
    const data = await apiFetch(
      `/api/extension/bootstrap?installId=${encodeURIComponent(installId)}`
    );

    els.workspaceName.textContent = `Workspace: ${data.workspace.name}`;
    els.subscriptionStatus.textContent = `Subscription: ${data.subscriptionStatus}`;
    els.workspaceInfo.hidden = false;

    const { storeId } = await getSettings();
    populateStores(data.stores, data.device?.storeId ?? storeId);
    if (data.device?.name && !els.deviceName.value) {
      els.deviceName.value = data.device.name;
    }
    if (!silent) setStatus("Synced successfully.", true);
    return data;
  } catch (err) {
    if (!silent) setStatus(err.message, false);
    throw err;
  }
}

/** Save settings, verify the connection, and register the device. */
async function connect() {
  const apiBaseUrl = els.apiBaseUrl.value.trim().replace(/\/+$/, "");
  const token = els.token.value.trim();
  const deviceName = els.deviceName.value.trim();

  if (!apiBaseUrl || !token) {
    setStatus("API base URL and connection token are required.", false);
    return;
  }
  if (!deviceName) {
    setStatus("Give this PC a device name (e.g. Front Counter PC).", false);
    return;
  }

  els.connectBtn.disabled = true;
  try {
    await saveSettings({ apiBaseUrl, token, deviceName });

    // Verify token and load stores first.
    const data = await sync({ silent: true });

    // Register (or update) this device.
    const installId = await ensureInstallId();
    const storeId = els.storeSelect.value || null;
    await apiFetch("/api/extension/register-device", {
      method: "POST",
      body: JSON.stringify({ extensionInstallId: installId, name: deviceName, storeId }),
    });
    await saveSettings({ storeId: storeId || "" });

    populateStores(data.stores, storeId);
    setStatus("Connected and device registered successfully.", true);
  } catch (err) {
    setStatus(err.message, false);
  } finally {
    els.connectBtn.disabled = false;
  }
}

els.connectBtn.addEventListener("click", connect);
els.syncBtn.addEventListener("click", () => sync());

// Persist store selection changes after initial registration.
els.storeSelect.addEventListener("change", async () => {
  const { apiBaseUrl, token, deviceName } = await getSettings();
  if (!apiBaseUrl || !token || !deviceName) return;
  try {
    const installId = await ensureInstallId();
    const storeId = els.storeSelect.value || null;
    await apiFetch("/api/extension/register-device", {
      method: "POST",
      body: JSON.stringify({ extensionInstallId: installId, name: deviceName, storeId }),
    });
    await saveSettings({ storeId: storeId || "" });
    setStatus("Store assignment updated.", true);
  } catch (err) {
    setStatus(err.message, false);
  }
});

// Initialize form from saved settings.
(async function init() {
  const settings = await getSettings();
  els.apiBaseUrl.value = settings.apiBaseUrl;
  els.token.value = settings.token;
  els.deviceName.value = settings.deviceName;
  if (settings.apiBaseUrl && settings.token) {
    sync({ silent: true }).catch(() => undefined);
  }
})();
