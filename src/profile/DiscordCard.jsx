import { ArrowRight, Gamepad2, Globe, Monitor, Music, Radio, Smartphone } from "lucide-react";
import { siSpotify } from "simple-icons";
import { statusStyle } from "../shared/config.js";
import { activityImageUrl, decorationUrl, discordAvatarUrl, serverTag } from "../shared/useLanyard.js";
import { formatClock, hexToRgba } from "../shared/utils.js";
import { useNow } from "./hooks.js";

// Sizes follow Discord's own activity card ("size-60": 60px picture, 24px small
// picture). The small picture has a fixed WIDTH and keeps its natural height, so
// tall transparent art (a character) stands up out of the corner the way it
// does in Discord. It sits 4px past the bottom-right corner, and a round hole is
// cut out of the big picture behind it.
const IMAGE = 60;
const SMALL = 24;
const SMALL_OFFSET = 4;
const CUTOUT_GAP = 3;
const TIMER_GREEN = "#3ba55c";

const ACTIVITY_VERBS = { 0: "Playing", 1: "Streaming", 2: "Listening to", 3: "Watching", 5: "Competing in" };

// Which Discord apps the user is on right now.
const DEVICES = [
  ["active_on_discord_desktop", Monitor, "Desktop"],
  ["active_on_discord_mobile", Smartphone, "Mobile"],
  ["active_on_discord_web", Globe, "Web"],
  ["active_on_discord_embedded", Gamepad2, "Console"],
];

const isSpotifyActivity = (activity) =>
  activity.type === 2 && (activity.id === "spotify:1" || activity.name === "Spotify");

function CustomStatus({ custom }) {
  const emoji = custom.emoji;
  return (
    <>
      {emoji?.id ? (
        <img
          src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}?size=32`}
          alt=""
          className="mr-1 inline h-4 w-4 align-[-3px]"
        />
      ) : (
        emoji?.name && <span className="mr-1">{emoji.name}</span>
      )}
      {custom.state}
    </>
  );
}

function ActivityImages({ large, small, largeText, smallText, fallback: Fallback }) {
  const main = large || small;
  const badge = large && small ? small : "";
  const center = IMAGE + SMALL_OFFSET - SMALL / 2;
  const hole = SMALL / 2 + CUTOUT_GAP;
  const mask = badge
    ? `radial-gradient(circle at ${center}px ${center}px, transparent ${hole}px, #000 ${hole + 0.5}px)`
    : undefined;

  return (
    <div className="relative shrink-0" style={{ width: IMAGE, height: IMAGE }}>
      {main ? (
        <img
          src={main}
          alt=""
          title={large ? largeText : smallText}
          draggable={false}
          className="h-full w-full rounded-lg object-cover"
          style={{ WebkitMaskImage: mask, maskImage: mask }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center rounded-lg bg-white/10">
          <Fallback className="h-6 w-6 opacity-70" />
        </div>
      )}
      {badge && (
        <img
          src={badge}
          alt=""
          title={smallText}
          draggable={false}
          className="absolute object-cover"
          style={{
            right: -SMALL_OFFSET,
            bottom: -SMALL_OFFSET,
            width: SMALL,
            height: "auto",
            maxHeight: IMAGE + SMALL_OFFSET,
            borderRadius: 9999,
          }}
        />
      )}
    </div>
  );
}

function ActivityCard({ header, icon, href, theme, children }) {
  const body = (
    <>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold opacity-75">
        {icon}
        {header}
      </p>
      <div className="flex items-center gap-3">{children}</div>
    </>
  );
  const style = { background: hexToRgba(theme.text, 0.05) };
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg p-3 transition hover:brightness-125"
      style={style}
    >
      {body}
    </a>
  ) : (
    <div className="rounded-lg p-3" style={style}>
      {body}
    </div>
  );
}

function Progress({ elapsed, total, color, theme }) {
  return (
    <div className="mt-1.5 flex items-center gap-2 text-[10px] tabular-nums opacity-80">
      <span>{formatClock(elapsed)}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: hexToRgba(theme.text, 0.15) }}>
        <div className="h-full rounded-full" style={{ width: `${(elapsed / total) * 100}%`, background: color }} />
      </div>
      <span>{formatClock(total)}</span>
    </div>
  );
}

function SpotifyActivity({ spotify, now, theme }) {
  const { start, end } = spotify.timestamps ?? {};
  const total = start && end ? (end - start) / 1000 : 0;
  const elapsed = start ? Math.min(Math.max((now - start) / 1000, 0), total || Infinity) : 0;
  return (
    <ActivityCard
      theme={theme}
      header="Listening to Spotify"
      href={spotify.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : undefined}
      icon={
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#1ed760" aria-hidden="true">
          <path d={siSpotify.path} />
        </svg>
      }
    >
      <ActivityImages large={spotify.album_art_url} largeText={spotify.album} fallback={Music} />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-bold">{spotify.song}</p>
        <p className="truncate text-xs opacity-70">by {spotify.artist}</p>
        {spotify.album && <p className="truncate text-xs opacity-55">on {spotify.album}</p>}
        {total > 0 && <Progress elapsed={elapsed} total={total} color="#1ed760" theme={theme} />}
      </div>
    </ActivityCard>
  );
}

function OtherActivity({ activity, now, theme }) {
  const { start, end } = activity.timestamps ?? {};
  const streaming = activity.type === 1;
  const playing = activity.type === 0;
  const header = streaming
    ? `Live on ${activity.name}`
    : playing
      ? "Playing"
      : `${ACTIVITY_VERBS[activity.type] ?? "Playing"} ${activity.name}`;
  // Games put their own name first (like Discord); music/video lead with the title.
  const title = playing ? activity.name : activity.details || activity.name;
  const lines = (playing ? [activity.details, activity.state] : [activity.state, activity.assets?.large_text])
    .filter(Boolean)
    .slice(0, 2);
  const total = start && end ? (end - start) / 1000 : 0;
  const elapsed = start ? Math.max(now - start, 0) / 1000 : 0;

  return (
    <ActivityCard
      theme={theme}
      header={header}
      href={streaming && activity.url ? activity.url : undefined}
      icon={streaming ? <Radio className="h-3.5 w-3.5 text-[#b28dff]" /> : null}
    >
      <ActivityImages
        large={activityImageUrl(activity, "large")}
        small={activityImageUrl(activity, "small")}
        largeText={activity.assets?.large_text}
        smallText={activity.assets?.small_text}
        fallback={streaming ? Radio : Gamepad2}
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-bold">{title}</p>
        {lines.map((line) => (
          <p key={line} className="truncate text-xs opacity-70">
            {line}
          </p>
        ))}
        {total > 0 ? (
          <Progress elapsed={Math.min(elapsed, total)} total={total} color={theme.accent} theme={theme} />
        ) : (
          start && (
            <p
              className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold tabular-nums"
              style={{ color: TIMER_GREEN }}
            >
              {playing && <Gamepad2 className="h-3.5 w-3.5" />}
              {formatClock(elapsed)}
              {!playing && <span className="font-normal opacity-80">elapsed</span>}
            </p>
          )
        )}
      </div>
    </ActivityCard>
  );
}

export default function DiscordCard({ discord, presence, theme, tile, avatarOverride = "" }) {
  const live = presence.status === "live" && presence.data?.discord_user ? presence.data : null;
  const user = live?.discord_user;
  const name = user ? user.global_name || user.display_name || user.username : discord.fallbackName;
  const status = statusStyle(live ? live.discord_status : discord.fallbackStatus);
  const activities = live?.activities ?? [];
  const custom = activities.find((activity) => activity.type === 4);
  const spotify = discord.showActivity && live?.listening_to_spotify && live.spotify ? live.spotify : null;
  const others = discord.showActivity
    ? activities.filter((activity) => activity.type !== 4 && !isSpotifyActivity(activity)).slice(0, 2)
    : [];
  const now = useNow(Boolean(spotify || others.some((activity) => activity.timestamps)));
  const avatar = avatarOverride || (user ? discordAvatarUrl(user, 128) : "");
  const decoration = user && discord.useDecoration ? decorationUrl(user) : "";
  const tag = serverTag(user);
  const devices = live ? DEVICES.filter(([key]) => live[key]) : [];
  const userId = discord.userId.trim();

  return (
    <div className="p-4" style={tile}>
      <div className="flex items-center gap-3.5">
        <div className="relative h-14 w-14 shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div
              className="grid h-14 w-14 place-items-center rounded-full text-lg font-bold"
              style={{ background: hexToRgba(theme.accent, 0.25) }}
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
              style={{ inset: "-10%", width: "120%", height: "120%" }}
            />
          )}
          <span
            title={status.label}
            className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full"
            style={{ background: status.color, boxShadow: `0 0 0 3px ${theme.background.color}` }}
          />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate font-semibold">{name || "Discord user"}</p>
            {tag && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-px text-[10px] font-bold"
                style={{ background: hexToRgba(theme.text, 0.1) }}
                title="Server tag"
              >
                {tag.badge && (
                  <img
                    src={tag.badge}
                    alt=""
                    className="h-3 w-3"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}
                {tag.tag}
              </span>
            )}
          </div>
          <p className="flex min-w-0 items-center gap-1.5 text-xs opacity-65">
            <span className="truncate">{custom ? <CustomStatus custom={custom} /> : status.label}</span>
            {devices.map(([key, Icon, label]) => (
              <span key={key} title={`On ${label}`} aria-label={`On ${label}`} className="shrink-0">
                <Icon className="h-3 w-3" />
              </span>
            ))}
          </p>
        </div>
        {discord.showButton && userId && (
          <a
            href={`https://discord.com/users/${userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-semibold transition hover:brightness-125"
            style={{
              border: `1px solid ${hexToRgba(theme.borderColor, theme.borderOpacity)}`,
              borderRadius: Math.max(theme.radius - 2, 6),
            }}
          >
            Add on Discord
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}
      </div>
      {(spotify || others.length > 0) && (
        <div className="mt-3 space-y-2">
          {spotify && <SpotifyActivity spotify={spotify} now={now} theme={theme} />}
          {others.map((activity, index) => (
            <OtherActivity
              key={activity.id ?? `${activity.name}-${index}`}
              activity={activity}
              now={now}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
}
