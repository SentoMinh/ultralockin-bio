import { LoaderCircle } from "lucide-react";
import { DISCORD_STATUSES, statusStyle } from "../../shared/config.js";
import { isDiscordId, useLanyard } from "../../shared/useLanyard.js";
import { Notice, Section, Segmented, TextInput, Toggle } from "../controls.jsx";

const STATUS_OPTIONS = DISCORD_STATUSES.map((status) => ({ id: status.id, label: status.short }));

// Invite from the Lanyard README (github.com/Phineas/lanyard).
const LANYARD_INVITE = "https://discord.gg/UrXF2cfJ7F";

function LanyardStatus({ userId, presence }) {
  if (!userId) return <Notice tone="muted">Add your Discord ID to show your live status.</Notice>;
  if (!isDiscordId(userId)) return <Notice tone="warn">A Discord user ID is 17 to 20 digits.</Notice>;
  if (presence.status === "loading") {
    return (
      <Notice tone="muted">
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Checking Lanyard…
        </span>
      </Notice>
    );
  }
  if (presence.status === "live") {
    const user = presence.data.discord_user;
    const status = statusStyle(presence.data.discord_status);
    return (
      <Notice tone="ok">
        Live as <b>{user.global_name || user.username}</b> ·{" "}
        <span style={{ color: status.color }}>●</span> {status.label}. Status, music and games update on the
        page within seconds.
      </Notice>
    );
  }
  if (presence.status === "not-monitored") {
    return (
      <Notice tone="warn">
        <p className="font-semibold text-amber-50">Not live yet: Lanyard can&apos;t see this account.</p>
        <p className="mt-1">
          Join the Lanyard Discord server with this account:{" "}
          <a href={LANYARD_INVITE} target="_blank" rel="noreferrer" className="font-semibold underline">
            discord.gg/UrXF2cfJ7F
          </a>
          . Stay in it; this panel and the page switch to live on their own (checked every 30 seconds).
        </p>
      </Notice>
    );
  }
  return <Notice tone="warn">Couldn&apos;t reach Lanyard right now. Showing the fallback below.</Notice>;
}

export default function DiscordPanel({ config, update, editor }) {
  const discord = config.discord;
  const set = (key) => (value) => update(`discord.${key}`, value);
  const presence = useLanyard(editor.session.user.discordId);

  return (
    <>
      <Section title="Live status" description="Uses Lanyard (free, open source) for your real status, music and games.">
        <TextInput
          label="Discord account"
          value={`${editor.session.user.name} (ID ${editor.session.user.discordId})`}
          onChange={() => {}}
          readOnly
          hint="Your page always shows the Discord account you logged in with."
        />
        <LanyardStatus userId={editor.session.user.discordId} presence={presence} />
        <Toggle label="Show the Discord card" checked={discord.showPresence} onChange={set("showPresence")} />
        <Toggle
          label="Show music and games"
          hint="Spotify with a progress bar, games with play time, streams with a link."
          checked={discord.showActivity}
          onChange={set("showActivity")}
        />
        <Toggle
          label="Show my avatar decoration"
          hint="Only if Discord shares one for your account."
          checked={discord.useDecoration}
          onChange={set("useDecoration")}
        />
        <Toggle label="“Add on Discord” button" checked={discord.showButton} onChange={set("showButton")} />
      </Section>

      <Section title="So music and games show up" description="Discord only shares what your settings allow.">
        <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-white/60">
          <li>
            <b className="text-white/80">Games:</b> Settings → Activity Privacy → turn on sharing your detected
            activities. If a game isn&apos;t detected, add it under Registered Games.
          </li>
          <li>
            <b className="text-white/80">Spotify:</b> Settings → Connections → Spotify → turn on showing Spotify
            as your status.
          </li>
          <li>
            <b className="text-white/80">In the Lanyard server:</b> keep activity sharing on in that server&apos;s
            Privacy Settings.
          </li>
        </ul>
        <Toggle
          label="Preview with a sample activity"
          hint="Editor only: fake music and a game so you can see the card now. Never shown on the real page."
          checked={editor.sampleActivity}
          onChange={editor.setSampleActivity}
        />
      </Section>

      <Section title="When not live" description="Shown while Lanyard isn't tracking you.">
        <TextInput label="Name" value={discord.fallbackName} onChange={set("fallbackName")} />
        <Segmented label="Status" value={discord.fallbackStatus} onChange={set("fallbackStatus")} options={STATUS_OPTIONS} />
      </Section>
    </>
  );
}
