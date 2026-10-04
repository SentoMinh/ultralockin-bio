import { normalizeConfig, STARTER_CONFIG } from "./config.js";

// The local-only editor used one shared key; drafts are now kept per account.
const LEGACY_CONFIG_KEY = "bio-editor.config.v1";
const DRAFT_PREFIX = "bio-editor.draft.";
const UI_KEY = "bio-editor.ui.v1";

// postMessage types between the editor and the preview iframe.
export const MSG = {
  ready: "bio-editor:ready",
  config: "bio-editor:config",
  title: "bio-editor:title",
};

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,23}$/;

// A clean first profile for a new account, prefilled from their Discord login.
export function starterFor(user) {
  const config = normalizeConfig(structuredClone(STARTER_CONFIG));
  const suggested = String(user.username ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
  config.profile = {
    ...config.profile,
    displayName: user.name || user.username || "",
    username: USERNAME_PATTERN.test(suggested) ? suggested : "",
    description: "",
    pageTitle: user.name || user.username || "",
  };
  config.socials = [];
  config.links = [];
  config.discord = {
    ...config.discord,
    userId: user.discordId,
    fallbackName: user.username ?? "",
    fallbackStatus: "offline",
  };
  return config;
}

function readConfig(key) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? normalizeConfig(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

// Unpublished edits, kept in this browser until Publish. A draft remembers which
// published version it started from (`base`, the profile's updatedAt). If the
// published profile has changed since (another device, an admin push), the
// draft is stale and is ignored, so it can't overwrite the newer version.
export function loadDraft(userId, publishedAt) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DRAFT_PREFIX + userId) ?? "null");
    if (!saved || typeof saved !== "object") return null;
    const wrapped = "config" in saved && "base" in saved; // older drafts were the bare config
    const base = wrapped ? saved.base : null;
    if (publishedAt != null && base !== publishedAt) return null;
    return normalizeConfig(wrapped ? saved.config : saved);
  } catch {
    return null;
  }
}

export function saveDraft(userId, config, publishedAt) {
  try {
    window.localStorage.setItem(DRAFT_PREFIX + userId, JSON.stringify({ base: publishedAt ?? null, config }));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(userId) {
  try {
    window.localStorage.removeItem(DRAFT_PREFIX + userId);
  } catch {
    // Storage can be unavailable; nothing to clear then.
  }
}

// What the local-only editor saved before accounts existed.
export const loadLegacyConfig = () => readConfig(LEGACY_CONFIG_KEY);

const sortedJson = (value) =>
  JSON.stringify(value, (key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item).sort().map((name) => [name, item[name]]))
      : item,
  );

// True when two configs hold the same settings, whatever the key order.
export const sameConfig = (a, b) => sortedJson(a) === sortedJson(b);

export function loadUi(defaults) {
  try {
    return { ...defaults, ...JSON.parse(window.localStorage.getItem(UI_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

export function saveUi(ui) {
  try {
    window.localStorage.setItem(UI_KEY, JSON.stringify(ui));
  } catch {
    // Storage can be unavailable (private mode); the editor still works.
  }
}

export function downloadConfig(config) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${config.profile.username || "bio"}.bio.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readConfigFile(file) {
  return normalizeConfig(JSON.parse(await file.text()));
}
