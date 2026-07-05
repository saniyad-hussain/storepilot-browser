/**
 * StorePilot Access Hub - popup logic.
 * Shows the assigned store, categorized quick links, reply templates, and a
 * support request form. Sends a device heartbeat when opened.
 */
import { apiFetch, ensureInstallId, getSettings, sendHeartbeat } from "./shared.js";

const els = {
  storeName: document.getElementById("storeName"),
  loading: document.getElementById("loadingState"),
  error: document.getElementById("errorState"),
  notConnected: document.getElementById("notConnectedState"),
  content: document.getElementById("content"),
  secureBar: document.getElementById("secureBar"),
  secureText: document.getElementById("secureText"),
  networkName: document.getElementById("networkName"),
  linksList: document.getElementById("linksList"),
  linksEmpty: document.getElementById("linksEmpty"),
  templatesList: document.getElementById("templatesList"),
  templatesEmpty: document.getElementById("templatesEmpty"),
  supportForm: document.getElementById("supportForm"),
  supportType: document.getElementById("supportType"),
  supportMessage: document.getElementById("supportMessage"),
  supportSubmit: document.getElementById("supportSubmit"),
  supportResult: document.getElementById("supportResult"),
};

const CATEGORY_LABELS = {
  SOCIAL_MEDIA: "Social Media",
  WEBSITE: "Website",
  ADS: "Ads",
  POS: "POS",
  CANVA: "Canva",
  GOOGLE: "Google",
  VENDOR: "Vendor",
  SHIPPING: "Shipping",
  FINANCE: "Finance",
  PASSWORD_MANAGER: "Password Manager",
  OTHER: "Other",
};

let bootstrapData = null;

function showState(state) {
  els.loading.hidden = state !== "loading";
  els.error.hidden = state !== "error";
  els.notConnected.hidden = state !== "notConnected";
  els.content.hidden = state !== "content";
}

function openOptionsPage() {
  chrome.runtime.openOptionsPage();
}

document.getElementById("openOptions").addEventListener("click", openOptionsPage);
document.getElementById("goToOptions").addEventListener("click", openOptionsPage);

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = true));
    document.getElementById(`tab-${tab.dataset.tab}`).hidden = false;
  });
});

/** Render categorized links, filtered to the assigned store (plus shared). */
function renderLinks() {
  const storeId = bootstrapData.device?.storeId ?? null;
  const links = bootstrapData.links.filter((l) => !l.storeId || l.storeId === storeId);

  els.linksList.innerHTML = "";
  if (links.length === 0) {
    els.linksEmpty.hidden = false;
    return;
  }
  els.linksEmpty.hidden = true;

  const byCategory = {};
  for (const link of links) {
    (byCategory[link.category] ??= []).push(link);
  }

  for (const [category, items] of Object.entries(byCategory)) {
    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = CATEGORY_LABELS[category] ?? category;
    els.linksList.appendChild(title);

    for (const link of items) {
      const row = document.createElement("div");
      row.className = "link-row";

      const info = document.createElement("div");
      info.className = "link-info";
      const titleEl = document.createElement("div");
      titleEl.className = "link-title";
      titleEl.textContent = link.title;
      if (link.isSensitive) {
        const badge = document.createElement("span");
        badge.className = "sensitive-badge";
        badge.textContent = "sensitive";
        titleEl.appendChild(badge);
      }
      info.appendChild(titleEl);
      if (link.description) {
        const desc = document.createElement("div");
        desc.className = "link-desc";
        desc.textContent = link.description;
        info.appendChild(desc);
      }

      const openBtn = document.createElement("button");
      openBtn.className = "btn small";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => {
        // Only http/https URLs are stored server-side; open in a new tab.
        chrome.tabs.create({ url: link.url });
      });

      row.appendChild(info);
      row.appendChild(openBtn);
      els.linksList.appendChild(row);
    }
  }
}

/** Render reply templates with copy buttons. */
function renderTemplates() {
  const storeId = bootstrapData.device?.storeId ?? null;
  const templates = bootstrapData.templates.filter((t) => !t.storeId || t.storeId === storeId);

  els.templatesList.innerHTML = "";
  if (templates.length === 0) {
    els.templatesEmpty.hidden = false;
    return;
  }
  els.templatesEmpty.hidden = true;

  for (const template of templates) {
    const card = document.createElement("div");
    card.className = "template-card";

    const title = document.createElement("div");
    title.className = "template-title";
    title.textContent = template.title;

    const body = document.createElement("div");
    body.className = "template-body";
    body.textContent = template.body;

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn small";
    copyBtn.textContent = "Copy reply";
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(template.body);
      copyBtn.textContent = "Copied ✓";
      setTimeout(() => (copyBtn.textContent = "Copy reply"), 1500);
    });

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(copyBtn);
    els.templatesList.appendChild(card);
  }
}

// Support request form
els.supportForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = els.supportMessage.value.trim();
  if (!message) return;

  els.supportSubmit.disabled = true;
  els.supportResult.hidden = true;
  try {
    const installId = await ensureInstallId();
    await apiFetch("/api/extension/support-request", {
      method: "POST",
      body: JSON.stringify({
        extensionInstallId: installId,
        type: els.supportType.value,
        message,
      }),
    });
    els.supportResult.textContent = "Support request sent. Your manager will follow up.";
    els.supportResult.className = "support-result ok";
    els.supportMessage.value = "";
  } catch (err) {
    els.supportResult.textContent = err.message;
    els.supportResult.className = "support-result err";
  } finally {
    els.supportResult.hidden = false;
    els.supportSubmit.disabled = false;
  }
});

/** Show the green secure bar and detect network name. */
function showSecureBar() {
  els.secureBar.hidden = false;
  els.secureText.textContent = "Your connection is secure";

  if (navigator.connection) {
    const conn = navigator.connection;
    const type = conn.effectiveType ?? conn.type ?? "";
    const typeLabel = { "4g": "4G", "3g": "3G", "2g": "2G", "slow-2g": "Slow", "wifi": "Wi-Fi", "ethernet": "Ethernet" }[type] ?? type.toUpperCase();
    if (typeLabel) els.networkName.textContent = `Network: ${typeLabel}`;
  }

  if (location.hostname === "localhost" || !navigator.onLine) return;

  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs?.[0]?.url ?? "";
      if (url.startsWith("https://")) {
        els.networkName.textContent = els.networkName.textContent || "Enjoy your work!";
      }
    });
  } catch (_) {}
}

/** Load bootstrap data and render the popup. */
async function init() {
  showState("loading");

  const settings = await getSettings();
  if (!settings.apiBaseUrl || !settings.token) {
    showState("notConnected");
    return;
  }

  // Heartbeat on popup open (non-blocking).
  sendHeartbeat();

  try {
    const installId = await ensureInstallId();
    bootstrapData = await apiFetch(
      `/api/extension/bootstrap?installId=${encodeURIComponent(installId)}`
    );

    const storeName =
      bootstrapData.device?.store?.name ??
      bootstrapData.workspace?.name ??
      "Connected";
    els.storeName.textContent = storeName;

    renderLinks();
    renderTemplates();
    showState("content");
    showSecureBar();
  } catch (err) {
    els.error.textContent = err.message;
    showState("error");
  }
}

init();
