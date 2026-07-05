/**
 * StorePilot Access Hub - background service worker (Manifest V3).
 * Sends a device heartbeat on browser startup and extension install/update.
 * Does NOT read browsing history, cookies, or keystrokes.
 */
import { sendHeartbeat } from "./shared.js";

chrome.runtime.onStartup.addListener(() => {
  sendHeartbeat();
});

chrome.runtime.onInstalled.addListener(() => {
  sendHeartbeat();
});
