import { useEffect, useMemo, useState } from "react";
import Tilt from "react-parallax-tilt";
import toast, { Toaster } from "react-hot-toast";
import { Eye, MapPin, Star } from "lucide-react";
import { BADGE_ICONS } from "../shared/platforms.jsx";
import { useMediaUrl } from "../shared/media.js";
import { AUDIO_CHANNEL, MSG } from "../shared/storage.js";
import { decorationUrl, discordAvatarUrl, samplePresence, useLanyard } from "../shared/useLanyard.js";
import { useViewCount } from "../shared/useViewCount.js";
import { copyText, hexToRgba } from "../shared/utils.js";
import { Background, BackgroundFx } from "./Background.jsx";
import DiscordCard from "./DiscordCard.jsx";
import { useAnimatedTitle, useGoogleFont, useTypewriter } from "./hooks.js";
import { LinkCards, Socials } from "./Links.jsx";
import { SoundToggle, useMusic } from "./MusicPlayer.jsx";
import NameEffect from "./NameEffect.jsx";
import { useCursorFx } from "./useCursorFx.js";

function surfaceStyle(theme) {
  const blur = theme.cardBlur ? `blur(${theme.cardBlur}px)` : undefined;
  return {
    backgroundColor: hexToRgba(theme.cardColor, theme.cardOpacity),
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    border: theme.borderWidth
      ? `${theme.borderWidth}px solid ${hexToRgba(theme.borderColor, theme.borderOpacity)}`
      : "none",
    borderRadius: theme.radius,
    boxShadow: theme.cardGlow
      ? `0 0 42px ${hexToRgba(theme.accent, 0.28)}, 0 24px 60px rgba(0, 0, 0, 0.35)`
      : undefined,
  };
}

// Boxes inside the single card: outlined, not glassy.
function innerTileStyle(theme) {
  return {
    backgroundColor: hexToRgba(theme.text, 0.03),
    border: theme.borderWidth
      ? `${theme.borderWidth}px solid ${hexToRgba(theme.borderColor, theme.borderOpacity)}`
      : `1px solid ${hexToRgba(theme.text, 0.08)}`,
    borderRadius: Math.max(theme.radius - 2, 0),
  };
}

function Avatar({ src, decoration, shape, ring, accent, name }) {
  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "28%" : "12px";
  return (
    <div className="relative mx-auto h-28 w-28">
      {ring === "spin" && (
        <div
          className="ring-spin absolute -inset-1"
          style={{
            borderRadius: radius,
            background: `conic-gradient(from 0deg, ${accent}, transparent 30%, ${accent} 55%, transparent 80%, ${accent})`,
          }}
        />
      )}
      {src ? (
        <img
          src={src}
          alt={name}
          draggable={false}
          className="relative h-full w-full object-cover"
          style={{
            borderRadius: radius,
            border: ring === "solid" ? `3px solid ${accent}` : undefined,
            boxShadow: ring === "glow" ? `0 0 28px ${hexToRgba(accent, 0.65)}` : undefined,
          }}
        />
      ) : (
        <div
          className="relative grid h-full w-full place-items-center text-4xl font-bold"
          style={{ borderRadius: radius, background: hexToRgba(accent, 0.25) }}
        >
          {(name || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      {decoration && (
        <img
          src={decoration}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute max-w-none"
          style={{ inset: "-12%", width: "124%", height: "124%" }}
        />
      )}
    </div>
  );
}

function Badges({ badges }) {
  if (!badges.length) return null;
  return (
    <div className="flex items-center gap-1">
      {badges.map((badge) => {
        const Icon = BADGE_ICONS[badge.icon] ?? Star;
        return (
          <span key={badge.id} className="group relative grid h-6 w-6 place-items-center" aria-label={badge.label}>
            <Icon
              className="h-[18px] w-[18px]"
              style={{ color: badge.color, filter: `drop-shadow(0 0 4px ${hexToRgba(badge.color, 0.6)})` }}
            />
            {badge.label && (
              <span className="pointer-events-none absolute bottom-full mb-1.5 scale-90 whitespace-nowrap rounded-md bg-black/85 px-2 py-0.5 text-[11px] font-medium text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
                {badge.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function Header({ profile, theme, effects, avatar, decoration, banner, views }) {
  const description = useTypewriter(profile.description, profile.typewriter, profile.typeSpeed);
  const hasBanner = Boolean(banner);
  const muted = hexToRgba(theme.text, 0.75);
  // The number comes from the real counter; hidden until it has loaded.
  const showViews = profile.showViews && views !== null;

  return (
    <div>
      {hasBanner && <img src={banner} alt="" draggable={false} className="block h-32 w-full object-cover" />}
      <div className={`relative flex flex-col items-center px-5 pb-5 text-center ${hasBanner ? "" : "pt-10"}`}>
        {(showViews || profile.location) && (
          <div className="absolute inset-x-4 top-3 flex items-center justify-between text-xs" style={{ color: muted }}>
            <span className="flex items-center gap-1.5">
              {showViews && (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  {views.toLocaleString()}
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              {profile.location && (
                <>
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location}
                </>
              )}
            </span>
          </div>
        )}
        <div className={hasBanner ? "-mt-14" : ""}>
          <Avatar
            src={avatar}
            decoration={decoration}
            shape={profile.avatarShape}
            ring={profile.avatarRing}
            accent={theme.accent}
            name={profile.displayName}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <h1 className="text-[30px] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
            <NameEffect
              text={profile.displayName || profile.username || "Your name"}
              effect={effects.nameEffect}
              theme={theme}
              sparkleColor={effects.sparkleColor}
            />
          </h1>
          <Badges badges={profile.badges} />
        </div>
        {profile.description && (
          <p
            className={`mt-1.5 min-h-[1.5em] max-w-md whitespace-pre-wrap text-[15px] [overflow-wrap:anywhere] ${profile.typewriter !== "off" ? "caret" : ""}`}
            style={{ color: hexToRgba(theme.text, 0.85) }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function EnterGate({ text, theme, onEnter }) {
  return (
    <button
      type="button"
      onClick={onEnter}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center backdrop-blur-xl"
      style={{ background: hexToRgba(theme.background.color, 0.55), color: theme.text }}
    >
      <span
        className="animate-pulse px-6 text-center text-2xl font-semibold tracking-wide"
        style={{ textShadow: `0 0 18px ${hexToRgba(theme.accent, 0.9)}` }}
      >
        {text || "click to enter"}
      </span>
    </button>
  );
}

const postTitle = (title) =>
  window.parent.postMessage({ type: MSG.title, title }, window.location.origin);

// `options` only comes from the editor (e.g. the sample-activity preview switch).
// `username` is the published name (empty inside the editor's preview).
export default function ProfilePage({ config, username, embedded, options }) {
  const { profile, theme, effects, discord } = config;
  const [entered, setEntered] = useState(!effects.enterGate);
  const presence = useLanyard(discord.showPresence || profile.useDiscordAvatar ? discord.userId : "");
  const sampleName = discord.fallbackName || profile.displayName;
  const sample = useMemo(
    () => (options?.sampleActivity ? samplePresence({ userId: discord.userId, name: sampleName }) : null),
    [options?.sampleActivity, discord.userId, sampleName],
  );
  const player = useMusic(config.music);
  const uploadedAvatar = useMediaUrl(profile.avatarUrl);
  const banner = useMediaUrl(profile.bannerUrl);
  // Opening the real page counts a view; the editor's preview only reads the number.
  const viewsFor = embedded ? (options?.publishedUsername ?? "") : username;
  const views = useViewCount(profile.showViews ? viewsFor : "", { count: !embedded });

  // Turning the splash on in the editor shows it again; turning it off skips it.
  useEffect(() => {
    setEntered(!effects.enterGate);
  }, [effects.enterGate]);

  useEffect(() => {
    document.body.style.backgroundColor = theme.background.color;
  }, [theme.background.color]);

  // Browsers block sound until the visitor does something. Without the splash,
  // music starts on their first click or key press. The editor's preview stays quiet.
  const { hasTrack, playing, play, pause } = player;
  useEffect(() => {
    if (embedded || effects.enterGate || !hasTrack) return undefined;
    const events = ["pointerdown", "keydown"];
    const start = () => {
      for (const name of events) window.removeEventListener(name, start);
      play();
    };
    for (const name of events) window.addEventListener(name, start);
    return () => {
      for (const name of events) window.removeEventListener(name, start);
    };
  }, [embedded, effects.enterGate, hasTrack, play]);

  // In the editor, this preview and the song bar in the Music tab take turns:
  // starting one pauses the other.
  useEffect(() => {
    if (!embedded || typeof BroadcastChannel === "undefined") return undefined;
    const channel = new BroadcastChannel(AUDIO_CHANNEL);
    channel.onmessage = () => pause();
    if (playing) channel.postMessage("preview");
    return () => channel.close();
  }, [embedded, playing, pause]);

  useGoogleFont(theme.font);
  useAnimatedTitle(profile.pageTitle, profile.animatedTitle, embedded ? postTitle : null);
  useCursorFx(effects, theme);

  const discordUser = presence.status === "live" ? presence.data?.discord_user : null;
  const avatar = profile.useDiscordAvatar && discordUser ? discordAvatarUrl(discordUser) : uploadedAvatar;
  const decoration = discord.useDecoration && discordUser ? decorationUrl(discordUser) : "";
  const oneCard = theme.layout === "card";
  const surface = surfaceStyle(theme);
  const tile = oneCard ? innerTileStyle(theme) : surface;

  const onCopy = async (value, label) => {
    const ok = await copyText(value);
    if (ok) toast.success(`Copied ${label}`);
    else toast.error("Couldn't copy that");
  };

  const socials = config.socials.filter((social) => social.value.trim());
  const links = config.links.filter((link) => link.title.trim() || link.url.trim());
  const showDiscord =
    discord.showPresence &&
    (sample || presence.status === "live" || discord.fallbackName.trim() || discord.userId.trim());

  const blocks = {
    socials: socials.length ? <Socials socials={socials} theme={theme} onCopy={onCopy} /> : null,
    links: links.length ? <LinkCards links={links} theme={theme} tile={tile} /> : null,
    discord: showDiscord ? (
      <DiscordCard
        discord={discord}
        presence={sample ?? presence}
        avatarOverride={sample ? uploadedAvatar : ""}
        theme={theme}
        tile={tile}
      />
    ) : null,
  };
  const sections = config.sections.filter((id) => blocks[id]);
  const stagger = (index) =>
    effects.entrance ? { className: "bio-in", style: { animationDelay: `${150 + index * 90}ms` } } : {};

  const header = (
    <Header
      profile={profile}
      theme={theme}
      effects={effects}
      avatar={avatar}
      decoration={decoration}
      banner={banner}
      views={views}
    />
  );

  const content = oneCard ? (
    <div style={surface} className="overflow-hidden">
      {header}
      {sections.length > 0 && (
        <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
          {sections.map((id, index) => (
            <div key={id} {...stagger(index)}>
              {blocks[id]}
              {id === "socials" && index < sections.length - 1 && (
                <div
                  className="mt-4 h-px"
                  style={{ background: hexToRgba(theme.borderColor, theme.borderOpacity * 0.6) }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <div style={surface} className="overflow-hidden">
        {header}
      </div>
      {sections.map((id, index) => (
        <div key={id} {...stagger(index)}>
          {id === "socials" ? (
            <div style={surface} className="p-4">
              {blocks[id]}
            </div>
          ) : (
            blocks[id]
          )}
        </div>
      ))}
    </div>
  );

  const showGate = effects.enterGate && !entered;

  return (
    <div
      className="relative min-h-full"
      style={{ color: theme.text, fontFamily: `"${theme.font}", ui-sans-serif, system-ui, sans-serif` }}
    >
      <Background background={theme.background} />
      <BackgroundFx mode={effects.background} theme={theme} />
      {showGate && (
        <EnterGate
          text={effects.enterText}
          theme={theme}
          onEnter={() => {
            setEntered(true);
            if (hasTrack) play();
          }}
        />
      )}
      {!showGate && hasTrack && <SoundToggle player={player} theme={theme} showError={embedded} />}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        {!showGate && (
          <Tilt
            tiltEnable={effects.tilt}
            tiltMaxAngleX={effects.tiltMax}
            tiltMaxAngleY={effects.tiltMax}
            tiltReverse
            perspective={1000}
            transitionSpeed={450}
            glareEnable={effects.tilt && effects.tiltGlare && oneCard}
            glareMaxOpacity={0.22}
            glareColor="#ffffff"
            glarePosition="all"
            glareBorderRadius={`${theme.radius}px`}
            className="relative w-full"
            style={{ maxWidth: theme.width }}
          >
            <div className={effects.entrance ? "bio-in" : undefined}>{content}</div>
          </Tilt>
        )}
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: hexToRgba(theme.cardColor, 0.92),
            color: theme.text,
            border: `1px solid ${hexToRgba(theme.borderColor, 0.25)}`,
            fontFamily: "inherit",
            fontSize: 14,
          },
        }}
      />
    </div>
  );
}
