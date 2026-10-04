import {
  siAnilist, siApplemusic, siArtstation, siBandcamp, siBattledotnet, siBehance, siBitcoin, siBluesky,
  siBuymeacoffee, siCashapp, siChessdotcom, siCounterstrike, siCrunchyroll, siCurseforge, siDeezer,
  siDeviantart, siDiscord, siDribbble, siElement, siEpicgames, siEthereum, siEtsy, siFaceit, siFacebook,
  siFortnite, siGithub, siGitlab, siGogdotcom, siGuilded, siGumroad, siInstagram, siItchdotio, siKakaotalk,
  siKick, siKofi, siLastdotfm, siLeagueoflegends, siLeetcode, siLetterboxd, siLine, siLinktree, siLitecoin,
  siMastodon, siMatrix, siMedium, siModrinth, siMonero, siMyanimelist, siNpm, siOpensea, siOsu, siPatreon,
  siPaypal, siPinterest, siPlaystation, siReddit, siRiotgames, siRoblox, siRockstargames, siShopify,
  siSignal, siSnapchat, siSolana, siSoundcloud, siSpotify, siStackoverflow, siSteam, siSubstack,
  siTeamspeak, siTelegram, siThreads, siTidal, siTiktok, siTrakt, siTumblr, siTwitch, siUbisoft, siValorant,
  siVenmo, siVk, siWechat, siWhatsapp, siX, siYoutube, siYoutubemusic,
} from "simple-icons";
import {
  BadgeCheck, BookOpen, Box, Briefcase, Bug, Camera, Code, Coffee, Crown, Flame, Gamepad2, Gem, Gift, Globe,
  Heart, Link2, Mail, Music, Rocket, Shield, ShoppingBag, Star, Video, Zap,
} from "lucide-react";

// Brand icons come from simple-icons (CC0). A few brands aren't in simple-icons,
// so they use a generic lucide icon with a fixed color instead.
export const PLATFORMS = [
  { id: "github", label: "GitHub", icon: siGithub, hint: "https://github.com/you" },
  { id: "x", label: "X / Twitter", icon: siX, hint: "https://x.com/you" },
  { id: "instagram", label: "Instagram", icon: siInstagram, hint: "https://instagram.com/you" },
  { id: "tiktok", label: "TikTok", icon: siTiktok, hint: "https://tiktok.com/@you" },
  { id: "youtube", label: "YouTube", icon: siYoutube, hint: "https://youtube.com/@you" },
  { id: "twitch", label: "Twitch", icon: siTwitch, hint: "https://twitch.tv/you" },
  { id: "kick", label: "Kick", icon: siKick, hint: "https://kick.com/you" },
  { id: "discord", label: "Discord", icon: siDiscord, hint: "Username (copies) or https://discord.gg/invite" },
  { id: "spotify", label: "Spotify", icon: siSpotify, hint: "https://open.spotify.com/user/…" },
  { id: "steam", label: "Steam", icon: siSteam, hint: "https://steamcommunity.com/id/you" },
  { id: "reddit", label: "Reddit", icon: siReddit, hint: "https://reddit.com/u/you" },
  { id: "telegram", label: "Telegram", icon: siTelegram, hint: "https://t.me/you" },
  { id: "snapchat", label: "Snapchat", icon: siSnapchat, hint: "https://snapchat.com/add/you" },
  { id: "facebook", label: "Facebook", icon: siFacebook, hint: "https://facebook.com/you" },
  { id: "threads", label: "Threads", icon: siThreads, hint: "https://threads.net/@you" },
  { id: "bluesky", label: "Bluesky", icon: siBluesky, hint: "https://bsky.app/profile/you" },
  { id: "mastodon", label: "Mastodon", icon: siMastodon, hint: "https://mastodon.social/@you" },
  { id: "whatsapp", label: "WhatsApp", icon: siWhatsapp, hint: "https://wa.me/number" },
  { id: "signal", label: "Signal", icon: siSignal, hint: "Username (copies)" },
  { id: "teamspeak", label: "TeamSpeak", icon: siTeamspeak, hint: "Server or address (copies)" },
  { id: "guilded", label: "Guilded", icon: siGuilded, hint: "https://guilded.gg/u/you" },
  { id: "matrix", label: "Matrix", icon: siMatrix, hint: "@you:matrix.org (copies)" },
  { id: "element", label: "Element", icon: siElement, hint: "https://matrix.to/#/@you:matrix.org" },
  { id: "vk", label: "VK", icon: siVk, hint: "https://vk.com/you" },
  { id: "wechat", label: "WeChat", icon: siWechat, hint: "WeChat ID (copies)" },
  { id: "line", label: "LINE", icon: siLine, hint: "LINE ID (copies)" },
  { id: "kakaotalk", label: "KakaoTalk", icon: siKakaotalk, hint: "Kakao ID (copies)" },
  { id: "soundcloud", label: "SoundCloud", icon: siSoundcloud, hint: "https://soundcloud.com/you" },
  { id: "applemusic", label: "Apple Music", icon: siApplemusic, hint: "https://music.apple.com/…" },
  { id: "youtubemusic", label: "YouTube Music", icon: siYoutubemusic, hint: "https://music.youtube.com/…" },
  { id: "lastfm", label: "Last.fm", icon: siLastdotfm, hint: "https://last.fm/user/you" },
  { id: "deezer", label: "Deezer", icon: siDeezer, hint: "https://deezer.com/profile/…" },
  { id: "tidal", label: "TIDAL", icon: siTidal, hint: "https://tidal.com/…" },
  { id: "bandcamp", label: "Bandcamp", icon: siBandcamp, hint: "https://you.bandcamp.com" },
  { id: "roblox", label: "Roblox", icon: siRoblox, hint: "https://roblox.com/users/…" },
  { id: "valorant", label: "VALORANT", icon: siValorant, hint: "Riot ID (copies)" },
  { id: "riotgames", label: "Riot Games", icon: siRiotgames, hint: "Riot ID (copies)" },
  { id: "leagueoflegends", label: "League of Legends", icon: siLeagueoflegends, hint: "Summoner name (copies)" },
  { id: "fortnite", label: "Fortnite", icon: siFortnite, hint: "Epic name (copies)" },
  { id: "counterstrike", label: "Counter-Strike", icon: siCounterstrike, hint: "Profile link" },
  { id: "faceit", label: "FACEIT", icon: siFaceit, hint: "https://faceit.com/players/you" },
  { id: "osu", label: "osu!", icon: siOsu, hint: "https://osu.ppy.sh/users/…" },
  { id: "epicgames", label: "Epic Games", icon: siEpicgames, hint: "Epic name (copies)" },
  { id: "playstation", label: "PlayStation", icon: siPlaystation, hint: "PSN ID (copies)" },
  { id: "xbox", label: "Xbox", lucide: Gamepad2, color: "#107c10", hint: "Gamertag (copies)" },
  { id: "battlenet", label: "Battle.net", icon: siBattledotnet, hint: "BattleTag (copies)" },
  { id: "gog", label: "GOG", icon: siGogdotcom, hint: "https://gog.com/u/you" },
  { id: "ubisoft", label: "Ubisoft", icon: siUbisoft, hint: "Ubisoft name (copies)" },
  { id: "rockstar", label: "Rockstar", icon: siRockstargames, hint: "Social Club name (copies)" },
  { id: "itchio", label: "itch.io", icon: siItchdotio, hint: "https://you.itch.io" },
  { id: "modrinth", label: "Modrinth", icon: siModrinth, hint: "https://modrinth.com/user/you" },
  { id: "curseforge", label: "CurseForge", icon: siCurseforge, hint: "https://curseforge.com/members/you" },
  { id: "namemc", label: "NameMC", lucide: Box, color: "#9ca3af", hint: "https://namemc.com/profile/…" },
  { id: "chess", label: "Chess.com", icon: siChessdotcom, hint: "https://chess.com/member/you" },
  { id: "pinterest", label: "Pinterest", icon: siPinterest, hint: "https://pinterest.com/you" },
  { id: "tumblr", label: "Tumblr", icon: siTumblr, hint: "https://you.tumblr.com" },
  { id: "behance", label: "Behance", icon: siBehance, hint: "https://behance.net/you" },
  { id: "dribbble", label: "Dribbble", icon: siDribbble, hint: "https://dribbble.com/you" },
  { id: "artstation", label: "ArtStation", icon: siArtstation, hint: "https://artstation.com/you" },
  { id: "deviantart", label: "DeviantArt", icon: siDeviantart, hint: "https://deviantart.com/you" },
  { id: "letterboxd", label: "Letterboxd", icon: siLetterboxd, hint: "https://letterboxd.com/you" },
  { id: "myanimelist", label: "MyAnimeList", icon: siMyanimelist, hint: "https://myanimelist.net/profile/you" },
  { id: "anilist", label: "AniList", icon: siAnilist, hint: "https://anilist.co/user/you" },
  { id: "crunchyroll", label: "Crunchyroll", icon: siCrunchyroll, hint: "Profile link" },
  { id: "trakt", label: "Trakt", icon: siTrakt, hint: "https://trakt.tv/users/you" },
  { id: "medium", label: "Medium", icon: siMedium, hint: "https://medium.com/@you" },
  { id: "substack", label: "Substack", icon: siSubstack, hint: "https://you.substack.com" },
  { id: "gitlab", label: "GitLab", icon: siGitlab, hint: "https://gitlab.com/you" },
  { id: "stackoverflow", label: "Stack Overflow", icon: siStackoverflow, hint: "https://stackoverflow.com/users/…" },
  { id: "leetcode", label: "LeetCode", icon: siLeetcode, hint: "https://leetcode.com/you" },
  { id: "npm", label: "npm", icon: siNpm, hint: "https://npmjs.com/~you" },
  { id: "linkedin", label: "LinkedIn", lucide: Briefcase, color: "#0a66c2", hint: "https://linkedin.com/in/you" },
  { id: "linktree", label: "Linktree", icon: siLinktree, hint: "https://linktr.ee/you" },
  { id: "patreon", label: "Patreon", icon: siPatreon, hint: "https://patreon.com/you" },
  { id: "kofi", label: "Ko-fi", icon: siKofi, hint: "https://ko-fi.com/you" },
  { id: "buymeacoffee", label: "Buy Me a Coffee", icon: siBuymeacoffee, hint: "https://buymeacoffee.com/you" },
  { id: "gumroad", label: "Gumroad", icon: siGumroad, hint: "https://you.gumroad.com" },
  { id: "etsy", label: "Etsy", icon: siEtsy, hint: "https://etsy.com/shop/you" },
  { id: "shopify", label: "Shopify", icon: siShopify, hint: "Your store link" },
  { id: "paypal", label: "PayPal", icon: siPaypal, hint: "https://paypal.me/you" },
  { id: "cashapp", label: "Cash App", icon: siCashapp, hint: "https://cash.app/$you" },
  { id: "venmo", label: "Venmo", icon: siVenmo, hint: "https://venmo.com/you" },
  { id: "bitcoin", label: "Bitcoin", icon: siBitcoin, hint: "Wallet address (copies)" },
  { id: "ethereum", label: "Ethereum", icon: siEthereum, hint: "Wallet address (copies)" },
  { id: "litecoin", label: "Litecoin", icon: siLitecoin, hint: "Wallet address (copies)" },
  { id: "solana", label: "Solana", icon: siSolana, hint: "Wallet address (copies)" },
  { id: "monero", label: "Monero", icon: siMonero, hint: "Wallet address (copies)" },
  { id: "opensea", label: "OpenSea", icon: siOpensea, hint: "https://opensea.io/you" },
  { id: "email", label: "Email", lucide: Mail, color: "#ea4335", hint: "you@mail.com (copies) or mailto:you@mail.com" },
  { id: "website", label: "Website", lucide: Globe, color: "#a3a3a3", hint: "https://example.com" },
];

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((platform) => [platform.id, platform]));

export const getPlatform = (id) => PLATFORM_MAP[id] ?? PLATFORM_MAP.website;

export const platformColor = (platform) =>
  platform.icon ? `#${platform.icon.hex}` : platform.color;

export function PlatformIcon({ id, className, style }) {
  const platform = getPlatform(id);
  if (platform.icon) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
        <path d={platform.icon.path} />
      </svg>
    );
  }
  const Icon = platform.lucide;
  return <Icon className={className} style={style} aria-hidden="true" />;
}

export const LINK_ICONS = {
  link: Link2,
  globe: Globe,
  shop: ShoppingBag,
  music: Music,
  game: Gamepad2,
  video: Video,
  camera: Camera,
  code: Code,
  book: BookOpen,
  heart: Heart,
  star: Star,
  gift: Gift,
  work: Briefcase,
  coffee: Coffee,
  rocket: Rocket,
  mail: Mail,
};

export const BADGE_ICONS = {
  crown: Crown,
  verified: BadgeCheck,
  code: Code,
  shield: Shield,
  star: Star,
  gem: Gem,
  heart: Heart,
  flame: Flame,
  zap: Zap,
  bug: Bug,
  music: Music,
  gamepad: Gamepad2,
};
