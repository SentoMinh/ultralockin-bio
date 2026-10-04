export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const getIn = (target, path) =>
  String(path)
    .split(".")
    .reduce((node, key) => (node == null ? undefined : node[key]), target);

// Immutable update for dotted paths such as "theme.accent" or "socials.2.value".
export function setIn(target, path, value) {
  const [head, ...rest] = Array.isArray(path) ? path : String(path).split(".");
  const copy = Array.isArray(target) ? [...target] : { ...(target ?? {}) };
  copy[head] = rest.length ? setIn(target?.[head], rest, value) : value;
  return copy;
}

// Fills missing or mistyped keys from `defaults`, so older saved configs keep working.
export function withDefaults(defaults, value) {
  if (Array.isArray(defaults)) return Array.isArray(value) ? value : defaults;
  if (defaults && typeof defaults === "object") {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const merged = { ...source };
    for (const key of Object.keys(defaults)) merged[key] = withDefaults(defaults[key], source[key]);
    return merged;
  }
  if (value === undefined || value === null) return defaults;
  return typeof value === typeof defaults ? value : defaults;
}

function parseHex(hex) {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!match) return null;
  const digits =
    match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  const n = Number.parseInt(digits, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexToRgba(hex, alpha = 1) {
  const [r, g, b] = parseHex(hex) ?? [255, 255, 255];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function luminance(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const isDarkColor = (hex) => luminance(hex) < 0.35;

// Keeps brand colors visible: near-black logos on dark pages (and near-white
// logos on light pages) fall back to the text color.
export function visibleColor(hex, darkPage, fallback) {
  const lum = luminance(hex);
  if (darkPage && lum < 0.04) return fallback;
  if (!darkPage && lum > 0.8) return fallback;
  return hex;
}

// Links open in a new tab; anything else (a username, an address) gets copied.
export const isOpenableLink = (value) =>
  /^(https?:\/\/|mailto:|tel:)/i.test(String(value ?? "").trim());

export const prettyUrl = (url) =>
  String(url ?? "")
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/i, "")
    .replace(/\/$/, "");

export function formatClock(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Splits text into visible characters, keeping emoji like "👩‍💻" whole.
export function splitGraphemes(text) {
  const value = String(text ?? "");
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(value), (part) => part.segment);
  }
  return Array.from(value);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
