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
  storeCheckboxes: document.getElementById("storeCheckboxes"),
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

function getCheckedStoreIds() {
  return Array.from(
    els.storeCheckboxes.querySelectorAll("input[type=checkbox]:checked")
  ).map((cb) => cb.value);
}

function populateStores(stores, selectedIds = []) {
  els.storeCheckboxes.innerHTML = "";
  if (!stores.length) {
    els.storeCheckboxes.innerHTML = '<p class="muted-hint" style="padding:10px">No stores found in this workspace.</p>';
    return;
  }
  for (const store of stores) {
    const item = document.createElement("label");
    item.className = "store-checkbox-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = store.id;
    cb.checked = selectedIds.includes(store.id);

    const label = document.createElement("span");
    label.className = "store-label";
    label.textContent = store.name;

    item.appendChild(cb);
    item.appendChild(label);
    els.storeCheckboxes.appendChild(item);

    cb.addEventListener("change", saveStoreSelection);
  }
}

async function saveStoreSelection() {
  const { apiBaseUrl, token, deviceName } = await getSettings();
  if (!apiBaseUrl || !token || !deviceName) return;
  const storeIds = getCheckedStoreIds();
  const primaryStoreId = storeIds[0] || null;
  try {
    const installId = await ensureInstallId();
    await apiFetch("/api/extension/register-device", {
      method: "POST",
      body: JSON.stringify({ extensionInstallId: installId, name: deviceName, storeId: primaryStoreId }),
    });
    await saveSettings({ storeIds, storeId: primaryStoreId || "" });
    setStatus(`Stores updated (${storeIds.length} selected).`, true);
  } catch (err) {
    setStatus(err.message, false);
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

    const { storeIds } = await getSettings();
    const activeIds = storeIds.length ? storeIds : (data.device?.storeId ? [data.device.storeId] : []);
    populateStores(data.stores, activeIds);
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

    // Register (or update) this device with primary store.
    const installId = await ensureInstallId();
    const storeIds = getCheckedStoreIds();
    const primaryStoreId = storeIds[0] || null;
    await apiFetch("/api/extension/register-device", {
      method: "POST",
      body: JSON.stringify({ extensionInstallId: installId, name: deviceName, storeId: primaryStoreId }),
    });
    await saveSettings({ storeIds, storeId: primaryStoreId || "" });

    setStatus("Connected and device registered successfully.", true);
  } catch (err) {
    setStatus(err.message, false);
  } finally {
    els.connectBtn.disabled = false;
  }
}

els.connectBtn.addEventListener("click", connect);
els.syncBtn.addEventListener("click", () => sync());

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
