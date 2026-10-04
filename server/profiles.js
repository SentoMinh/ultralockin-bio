import {
  AVATAR_RINGS,
  AVATAR_SHAPES,
  BACKGROUND_EFFECTS,
  BACKGROUND_TYPES,
  CONFIG_VERSION,
  CURSOR_EFFECTS,
  DISCORD_STATUSES,
  FONTS,
  LAYOUTS,
  NAME_EFFECTS,
  SECTION_IDS,
  STARTER_CONFIG,
  TYPEWRITER_MODES,
} from "../src/shared/config.js";

// Names that are app pages, files, or would mislead visitors.
const RESERVED = new Set([
  "api", "media", "assets", "dashboard", "profile", "index", "home", "login", "logout", "signin", "signup",
  "register", "auth", "admin", "settings", "account", "invite", "invites", "about", "help", "support", "terms",
  "privacy", "static", "public", "favicon", "robots", "sitemap", "www", "bio", "new", "edit", "me", "null",
  "undefined", "oneko", "preview", "discord", "staff", "mod", "moderator", "official", "ultralockin", "404",
]);

export const MAX_CONFIG_BYTES = 64 * 1024;

// 3-24 characters: letters, numbers, "_" and "-". Returns "" when not allowed.
export function normalizeUsername(raw) {
  const username = String(raw ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(username)) return "";
  return RESERVED.has(username) ? "" : username;
}

export const isReservedPath = (segment) => RESERVED.has(String(segment).toLowerCase());

const ids = (options) => options.map((option) => option.id);
const text = (value, max) => (typeof value === "string" ? value : "").slice(0, max);
const bool = (value, fallback) => (typeof value === "boolean" ? value : fallback);
const number = (value, min, max, fallback) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const choice = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const color = (value, fallback) => (/^#[0-9a-f]{6}$/i.test(value ?? "") ? value.toLowerCase() : fallback);
const itemId = (value, index) => (/^[\w-]{1,40}$/.test(value ?? "") ? value : `item-${index}`);
const list = (value, max, map) =>
  (Array.isArray(value) ? value : [])
    .slice(0, max)
    .map((item, index) => (item && typeof item === "object" ? map(item, index) : null))
    .filter(Boolean);

// Pictures, audio and video may only come from https links or this site's uploads.
function mediaUrl(value) {
  const url = text(value, 600).trim();
  return /^https:\/\//i.test(url) || /^\/media\/[\w./-]+$/.test(url) ? url : "";
}

// Rebuilds a profile from known fields only, so nothing unexpected is ever
// stored or rendered. `discordId` is the owner's own id: a page can only show
// its owner's Discord status.
export function sanitizeConfig(raw, { username, discordId }) {
  const d = STARTER_CONFIG;
  const profile = raw?.profile ?? {};
  const theme = raw?.theme ?? {};
  const background = theme.background ?? {};
  const effects = raw?.effects ?? {};
  const discord = raw?.discord ?? {};
  const music = raw?.music ?? {};
  const order = (Array.isArray(raw?.sections) ? raw.sections : []).filter(
    (id, index, all) => SECTION_IDS.includes(id) && all.indexOf(id) === index,
  );

  return {
    version: CONFIG_VERSION,
    profile: {
      displayName: text(profile.displayName, 60),
      username,
      description: text(profile.description, 400),
      typewriter: choice(profile.typewriter, ids(TYPEWRITER_MODES), "once"),
      typeSpeed: number(profile.typeSpeed, 20, 200, 60),
      pageTitle: text(profile.pageTitle, 80),
      animatedTitle: bool(profile.animatedTitle, true),
      avatarUrl: mediaUrl(profile.avatarUrl),
      useDiscordAvatar: bool(profile.useDiscordAvatar, true),
      avatarShape: choice(profile.avatarShape, ids(AVATAR_SHAPES), "circle"),
      avatarRing: choice(profile.avatarRing, ids(AVATAR_RINGS), "none"),
      bannerUrl: mediaUrl(profile.bannerUrl),
      location: text(profile.location, 60),
      showViews: bool(profile.showViews, true),
      badges: list(profile.badges, 8, (badge, index) => ({
        id: itemId(badge.id, index),
        icon: text(badge.icon, 20),
        label: text(badge.label, 30),
        color: color(badge.color, "#facc15"),
      })),
    },
    socials: list(raw?.socials, 30, (social, index) => ({
      id: itemId(social.id, index),
      platform: /^[a-z0-9]{1,30}$/.test(social.platform ?? "") ? social.platform : "website",
      value: text(social.value, 300),
    })),
    links: list(raw?.links, 20, (link, index) => ({
      id: itemId(link.id, index),
      title: text(link.title, 80),
      url: text(link.url, 500),
      icon: text(link.icon, 20),
    })),
    discord: {
      userId: discordId,
      showPresence: bool(discord.showPresence, true),
      showActivity: bool(discord.showActivity, true),
      useDecoration: bool(discord.useDecoration, true),
      showButton: bool(discord.showButton, true),
      fallbackName: text(discord.fallbackName, 40),
      fallbackStatus: choice(discord.fallbackStatus, ids(DISCORD_STATUSES), "offline"),
    },
    music: {
      // One song per page.
      tracks: list(music.tracks, 1, (track, index) => ({
        id: itemId(track.id, index),
        url: mediaUrl(track.url),
        start: number(track.start, 0, 86400, 0),
      })),
      volume: number(music.volume, 0, 1, 0.4),
    },
    theme: {
      font: choice(theme.font, FONTS.map((font) => font.name), "Inter"),
      accent: color(theme.accent, d.theme.accent),
      text: color(theme.text, d.theme.text),
      iconColor: color(theme.iconColor, d.theme.iconColor),
      brandColors: bool(theme.brandColors, false),
      iconGlow: bool(theme.iconGlow, true),
      roundSocials: bool(theme.roundSocials, true),
      cardColor: color(theme.cardColor, d.theme.cardColor),
      cardOpacity: number(theme.cardOpacity, 0, 1, d.theme.cardOpacity),
      cardBlur: number(theme.cardBlur, 0, 40, d.theme.cardBlur),
      borderColor: color(theme.borderColor, d.theme.borderColor),
      borderOpacity: number(theme.borderOpacity, 0, 1, 1),
      borderWidth: number(theme.borderWidth, 0, 4, 1),
      radius: number(theme.radius, 0, 32, d.theme.radius),
      cardGlow: bool(theme.cardGlow, false),
      layout: choice(theme.layout, ids(LAYOUTS), "card"),
      width: number(theme.width, 380, 760, 640),
      background: {
        type: choice(background.type, ids(BACKGROUND_TYPES), "color"),
        color: color(background.color, d.theme.background.color),
        color2: color(background.color2, d.theme.background.color2),
        angle: number(background.angle, 0, 360, 160),
        url: mediaUrl(background.url),
        blur: number(background.blur, 0, 40, 0),
        brightness: number(background.brightness, 20, 130, 100),
      },
    },
    effects: {
      tilt: bool(effects.tilt, true),
      tiltMax: number(effects.tiltMax, 2, 20, 6),
      tiltGlare: bool(effects.tiltGlare, false),
      cursor: choice(effects.cursor, ids(CURSOR_EFFECTS), "none"),
      cursorEmoji: text(effects.cursorEmoji, 24),
      cursorImage: mediaUrl(effects.cursorImage),
      nameEffect: choice(effects.nameEffect, ids(NAME_EFFECTS), "none"),
      sparkleColor: color(effects.sparkleColor, "#ffffff"),
      background: choice(effects.background, ids(BACKGROUND_EFFECTS), "none"),
      entrance: bool(effects.entrance, true),
      enterGate: bool(effects.enterGate, false),
      enterText: text(effects.enterText, 60),
    },
    sections: [...order, ...SECTION_IDS.filter((id) => !order.includes(id))],
  };
}
