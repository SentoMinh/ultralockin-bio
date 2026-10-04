import { uid, withDefaults } from "./utils.js";

export const CONFIG_VERSION = 1;

export const SECTION_IDS = ["socials", "links", "discord", "music"];

export const SECTION_LABELS = {
  socials: "Social icons",
  links: "Link cards",
  discord: "Discord card",
  music: "Music player",
};

// Google Fonts families. `css` is the css2 `family=` value (only real weights).
export const FONTS = [
  { name: "Mali", css: "Mali:wght@400;500;600;700" },
  { name: "Inter", css: "Inter:wght@400;500;600;700;800" },
  { name: "Poppins", css: "Poppins:wght@400;500;600;700" },
  { name: "Nunito", css: "Nunito:wght@400;600;700;800" },
  { name: "Outfit", css: "Outfit:wght@400;500;600;700" },
  { name: "Space Grotesk", css: "Space+Grotesk:wght@400;500;600;700" },
  { name: "Sora", css: "Sora:wght@400;600;700" },
  { name: "Comfortaa", css: "Comfortaa:wght@400;600;700" },
  { name: "Fredoka", css: "Fredoka:wght@400;500;600;700" },
  { name: "Quicksand", css: "Quicksand:wght@400;500;600;700" },
  { name: "JetBrains Mono", css: "JetBrains+Mono:wght@400;600;700" },
  { name: "Orbitron", css: "Orbitron:wght@400;600;700;800" },
  { name: "Press Start 2P", css: "Press+Start+2P" },
  { name: "VT323", css: "VT323" },
  { name: "Silkscreen", css: "Silkscreen:wght@400;700" },
  { name: "Pacifico", css: "Pacifico" },
  { name: "Caveat", css: "Caveat:wght@400;600;700" },
  { name: "Righteous", css: "Righteous" },
];

export const TYPEWRITER_MODES = [
  { id: "off", label: "Off" },
  { id: "once", label: "Type once" },
  { id: "loop", label: "Loop" },
];

export const AVATAR_SHAPES = [
  { id: "circle", label: "Circle" },
  { id: "rounded", label: "Rounded" },
  { id: "square", label: "Square" },
];

export const AVATAR_RINGS = [
  { id: "none", label: "None" },
  { id: "solid", label: "Solid" },
  { id: "glow", label: "Glow" },
  { id: "spin", label: "Spin" },
];

export const LAYOUTS = [
  { id: "card", label: "One card" },
  { id: "split", label: "Separate boxes" },
];

export const BACKGROUND_TYPES = [
  { id: "color", label: "Color" },
  { id: "gradient", label: "Gradient" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
];

export const CURSOR_EFFECTS = [
  { id: "none", label: "None", note: "Normal cursor" },
  { id: "cat", label: "Cat", note: "oneko chases it" },
  { id: "sparkle", label: "Fairy dust", note: "In your colors" },
  { id: "trailing", label: "Trailing", note: "Cursor echoes" },
  { id: "ghost", label: "Ghost", note: "Fading copy" },
  { id: "dot", label: "Dot", note: "Dot follows" },
  { id: "rainbow", label: "Rainbow", note: "Color ribbon" },
  { id: "bubble", label: "Bubbles", note: "Floating up" },
  { id: "snowflake", label: "Snowflakes", note: "Drifting down" },
  { id: "emoji", label: "Emoji", note: "Your emoji" },
];

export const NAME_EFFECTS = [
  { id: "none", label: "None", note: "Plain text" },
  { id: "sparkle", label: "Sparkles", note: "Twinkling stars" },
  { id: "glow", label: "Glow", note: "Accent halo" },
  { id: "rainbow", label: "Rainbow", note: "Moving colors" },
  { id: "shine", label: "Shine", note: "Light sweep" },
  { id: "glitch", label: "Glitch", note: "RGB split" },
];

export const BACKGROUND_EFFECTS = [
  { id: "none", label: "None", note: "Just the background" },
  { id: "snow", label: "Snow", note: "Soft flakes" },
  { id: "rain", label: "Rain", note: "Accent streaks" },
  { id: "stars", label: "Stars", note: "Twinkling sky" },
  { id: "fireflies", label: "Fireflies", note: "Glowing drift" },
  { id: "matrix", label: "Matrix", note: "Falling code" },
];

export const DISCORD_STATUSES = [
  { id: "online", label: "Online", short: "Online", color: "#23a55a" },
  { id: "idle", label: "Idle", short: "Idle", color: "#f0b232" },
  { id: "dnd", label: "Do Not Disturb", short: "DND", color: "#f23f43" },
  { id: "offline", label: "Offline", short: "Offline", color: "#80848e" },
];

export const statusStyle = (id) =>
  DISCORD_STATUSES.find((status) => status.id === id) ?? DISCORD_STATUSES[3];

// Default profile: a neutral example that also supplies every setting's default.
// New accounts start from starterFor() in storage.js, which fills in their Discord name.
export const STARTER_CONFIG = {
  version: CONFIG_VERSION,
  profile: {
    displayName: "Your Name",
    username: "",
    description: "Welcome to my bio!",
    typewriter: "once",
    typeSpeed: 60,
    pageTitle: "My bio",
    animatedTitle: true,
    avatarUrl: "",
    useDiscordAvatar: true,
    avatarShape: "circle",
    avatarRing: "glow",
    bannerUrl: "",
    location: "",
    showViews: true,
    badges: [],
  },
  socials: [{ id: "social-github", platform: "github", value: "https://github.com/" }],
  links: [{ id: "link-example", title: "My website", url: "https://example.com", icon: "link" }],
  discord: {
    userId: "",
    showPresence: true,
    showActivity: true,
    useDecoration: true,
    showButton: true,
    fallbackName: "",
    fallbackStatus: "offline",
  },
  music: { tracks: [], shuffle: false, volume: 0.4, showPlayer: true },
  theme: {
    font: "Mali",
    accent: "#619ee7",
    text: "#ffffff",
    iconColor: "#ffffff",
    brandColors: false,
    iconGlow: true,
    roundSocials: true,
    cardColor: "#000000",
    cardOpacity: 0,
    cardBlur: 11,
    borderColor: "#ffffff",
    borderOpacity: 1,
    borderWidth: 1,
    radius: 7,
    cardGlow: false,
    layout: "card",
    width: 640,
    background: {
      type: "color",
      color: "#101013",
      color2: "#1e1b4b",
      angle: 160,
      url: "",
      blur: 4,
      brightness: 81,
    },
  },
  effects: {
    tilt: true,
    tiltMax: 6,
    tiltGlare: false,
    cursor: "cat",
    cursorEmoji: "✨💫⭐",
    cursorImage: "",
    nameEffect: "sparkle",
    sparkleColor: "#ffffff",
    background: "none",
    entrance: true,
    enterGate: false,
    enterText: "click to enter",
  },
  sections: ["socials", "links", "discord", "music"],
};

// Presets change the look only (theme + effects), never text or links.
export const PRESETS = [
  {
    id: "ez",
    name: "E-Z classic",
    colors: ["#101013", "#619ee7", "#ffffff"],
    theme: {
      font: "Mali", accent: "#619ee7", text: "#ffffff", iconColor: "#ffffff", brandColors: false,
      iconGlow: true, roundSocials: true, cardColor: "#000000", cardOpacity: 0, cardBlur: 11,
      borderColor: "#ffffff", borderOpacity: 1, borderWidth: 1, radius: 7, cardGlow: false, layout: "card",
      background: { type: "color", color: "#101013", blur: 4, brightness: 81 },
    },
    effects: { nameEffect: "sparkle", sparkleColor: "#ffffff", cursor: "cat", background: "none" },
  },
  {
    id: "midnight",
    name: "Midnight glass",
    colors: ["#050816", "#312e81", "#8b9cff"],
    theme: {
      font: "Outfit", accent: "#8b9cff", text: "#e0e7ff", iconColor: "#c7d2fe", brandColors: false,
      iconGlow: true, roundSocials: true, cardColor: "#0f172a", cardOpacity: 0.55, cardBlur: 18,
      borderColor: "#a5b4fc", borderOpacity: 0.18, borderWidth: 1, radius: 20, cardGlow: true, layout: "card",
      background: { type: "gradient", color: "#050816", color2: "#312e81", angle: 160, blur: 0, brightness: 100 },
    },
    effects: { nameEffect: "glow", cursor: "sparkle", background: "stars" },
  },
  {
    id: "sakura",
    name: "Sakura",
    colors: ["#1a0612", "#5b1a3f", "#ff8fc7"],
    theme: {
      font: "Comfortaa", accent: "#ff8fc7", text: "#ffe4f1", iconColor: "#ffc2e2", brandColors: false,
      iconGlow: true, roundSocials: true, cardColor: "#3b1030", cardOpacity: 0.45, cardBlur: 14,
      borderColor: "#ffb3d9", borderOpacity: 0.35, borderWidth: 1, radius: 22, cardGlow: true, layout: "split",
      background: { type: "gradient", color: "#1a0612", color2: "#5b1a3f", angle: 200, blur: 0, brightness: 100 },
    },
    effects: { nameEffect: "sparkle", sparkleColor: "#ffc2e2", cursor: "sparkle", background: "snow" },
  },
  {
    id: "arcade",
    name: "Neon arcade",
    colors: ["#05050c", "#22d3ee", "#f0abfc"],
    theme: {
      font: "Orbitron", accent: "#22d3ee", text: "#e0f7ff", iconColor: "#22d3ee", brandColors: false,
      iconGlow: true, roundSocials: false, cardColor: "#020617", cardOpacity: 0.72, cardBlur: 6,
      borderColor: "#22d3ee", borderOpacity: 0.6, borderWidth: 1, radius: 4, cardGlow: true, layout: "card",
      background: { type: "color", color: "#05050c", blur: 0, brightness: 100 },
    },
    effects: { nameEffect: "glitch", cursor: "trailing", background: "matrix" },
  },
  {
    id: "ember",
    name: "Ember",
    colors: ["#0c0806", "#7c2d12", "#fb923c"],
    theme: {
      font: "Space Grotesk", accent: "#fb923c", text: "#fff7ed", iconColor: "#fdba74", brandColors: false,
      iconGlow: true, roundSocials: true, cardColor: "#1c0f08", cardOpacity: 0.6, cardBlur: 12,
      borderColor: "#fb923c", borderOpacity: 0.3, borderWidth: 1, radius: 14, cardGlow: true, layout: "card",
      background: { type: "gradient", color: "#0c0806", color2: "#7c2d12", angle: 180, blur: 0, brightness: 100 },
    },
    effects: { nameEffect: "shine", cursor: "dot", background: "fireflies" },
  },
  {
    id: "paper",
    name: "Paper",
    colors: ["#f4f4f5", "#ffffff", "#18181b"],
    theme: {
      font: "Inter", accent: "#18181b", text: "#18181b", iconColor: "#27272a", brandColors: true,
      iconGlow: false, roundSocials: false, cardColor: "#ffffff", cardOpacity: 0.85, cardBlur: 12,
      borderColor: "#18181b", borderOpacity: 0.1, borderWidth: 1, radius: 16, cardGlow: false, layout: "card",
      background: { type: "gradient", color: "#f4f4f5", color2: "#e4e4e7", angle: 180, blur: 0, brightness: 100 },
    },
    effects: { nameEffect: "none", cursor: "none", background: "none" },
  },
];

function listOf(items, shape) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      ...withDefaults(shape, item),
      id: typeof item.id === "string" && item.id ? item.id : uid(),
    }));
}

export function normalizeConfig(raw) {
  const config = withDefaults(STARTER_CONFIG, raw);
  config.version = CONFIG_VERSION;
  config.socials = listOf(config.socials, { id: "", platform: "website", value: "" });
  config.links = listOf(config.links, { id: "", title: "", url: "", icon: "link" });
  config.profile = {
    ...config.profile,
    badges: listOf(config.profile.badges, { id: "", icon: "star", label: "", color: "#facc15" }),
  };
  config.music = {
    ...config.music,
    tracks: listOf(config.music.tracks, { id: "", title: "", artist: "", url: "", cover: "" }),
  };
  const order = config.sections.filter(
    (id, index, list) => SECTION_IDS.includes(id) && list.indexOf(id) === index,
  );
  config.sections = [...order, ...SECTION_IDS.filter((id) => !order.includes(id))];
  return config;
}

export function applyPreset(config, preset) {
  return {
    ...config,
    theme: {
      ...config.theme,
      ...preset.theme,
      background: { ...config.theme.background, ...preset.theme.background },
    },
    effects: { ...config.effects, ...preset.effects },
  };
}
