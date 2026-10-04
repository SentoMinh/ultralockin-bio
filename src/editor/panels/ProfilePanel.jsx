import { Trash2 } from "lucide-react";
import { SITE_HOST } from "../../shared/api.js";
import { AVATAR_RINGS, AVATAR_SHAPES, TYPEWRITER_MODES } from "../../shared/config.js";
import { BADGE_ICONS } from "../../shared/platforms.jsx";
import { useViewCount } from "../../shared/useViewCount.js";
import { uid } from "../../shared/utils.js";
import {
  AddButton,
  Empty,
  iconButton,
  LocationInput,
  MediaInput,
  Notice,
  Section,
  Segmented,
  Slider,
  TextArea,
  TextInput,
  Toggle,
} from "../controls.jsx";
import { SortableList } from "../SortableList.jsx";

export default function ProfilePanel({ config, update, editor }) {
  const profile = config.profile;
  const set = (key) => (value) => update(`profile.${key}`, value);
  const badges = profile.badges;
  const publishedUsername = editor.published?.username ?? "";
  const viewCount = useViewCount(profile.showViews ? publishedUsername : "");

  return (
    <>
      <Section title="Identity" description="What visitors see first.">
        <TextInput label="Display name" value={profile.displayName} onChange={set("displayName")} placeholder="Your name" />
        <TextInput
          label="Username"
          hint={`Your page address: ${SITE_HOST}/${profile.username || "you"}. 3–24 letters, numbers, _ or -.`}
          value={profile.username}
          onChange={(value) => set("username")(value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24))}
        />
        <TextArea label="Description" value={profile.description} onChange={set("description")} placeholder="A short bio" />
        <Segmented label="Typing animation" value={profile.typewriter} onChange={set("typewriter")} options={TYPEWRITER_MODES} />
        {profile.typewriter !== "off" && (
          <Slider
            label="Typing speed"
            value={profile.typeSpeed}
            onChange={set("typeSpeed")}
            min={20}
            max={200}
            step={5}
            format={(v) => `${v} ms per letter`}
          />
        )}
      </Section>

      <Section title="Avatar">
        <Toggle
          label="Use my Discord avatar"
          hint="Needs your Discord ID (Discord tab) and a live Lanyard status."
          checked={profile.useDiscordAvatar}
          onChange={set("useDiscordAvatar")}
        />
        <MediaInput
          label={profile.useDiscordAvatar ? "Fallback image" : "Image"}
          value={profile.avatarUrl}
          onChange={set("avatarUrl")}
        />
        <Segmented label="Shape" value={profile.avatarShape} onChange={set("avatarShape")} options={AVATAR_SHAPES} />
        <Segmented label="Ring" value={profile.avatarRing} onChange={set("avatarRing")} options={AVATAR_RINGS} />
      </Section>

      <Section title="Banner" description="Optional strip above the avatar, best at 640 × 128. Empty means no banner.">
        <MediaInput label="Banner image" value={profile.bannerUrl} onChange={set("bannerUrl")} />
      </Section>

      <Section title="Details">
        <LocationInput
          label="Location"
          hint="Pick a city from the list, or type anything. City search by Open-Meteo (GeoNames data)."
          value={profile.location}
          onChange={set("location")}
        />
        <Toggle label="Show view counter" checked={profile.showViews} onChange={set("showViews")} />
        {profile.showViews && (
          <Notice tone="muted">
            {!publishedUsername ? (
              "Views start counting once your page is published."
            ) : viewCount === null ? (
              "The counter can't be reached right now, so the page hides the number."
            ) : (
              <>
                <b className="text-white/85">{viewCount.toLocaleString()}</b> {viewCount === 1 ? "view" : "views"} so
                far.
              </>
            )}{" "}
            Counted automatically when someone opens the page: one per person per day. This preview doesn&apos;t
            count.
          </Notice>
        )}
      </Section>

      <Section title="Browser tab">
        <TextInput label="Page title" value={profile.pageTitle} onChange={set("pageTitle")} />
        <Toggle
          label="Scroll the title"
          hint="Moves the tab title like a marquee."
          checked={profile.animatedTitle}
          onChange={set("animatedTitle")}
        />
      </Section>

      <Section
        title="Badges"
        description="Small icons next to your name, with a label on hover."
        action={
          <AddButton
            onClick={() =>
              update("profile.badges", [...badges, { id: uid(), icon: "star", label: "New badge", color: "#facc15" }])
            }
          />
        }
      >
        {badges.length === 0 ? (
          <Empty>No badges yet.</Empty>
        ) : (
          <SortableList
            items={badges}
            onReorder={(next) => update("profile.badges", next)}
            renderItem={(badge, index, handle) => (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-2">
                {handle}
                <select
                  className="ed-input w-28 shrink-0"
                  value={badge.icon}
                  onChange={(e) => update(`profile.badges.${index}.icon`, e.target.value)}
                  aria-label="Badge icon"
                >
                  {Object.keys(BADGE_ICONS).map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <input
                  className="ed-input"
                  value={badge.label}
                  onChange={(e) => update(`profile.badges.${index}.label`, e.target.value)}
                  aria-label="Badge label"
                />
                <input
                  type="color"
                  value={badge.color}
                  onChange={(e) => update(`profile.badges.${index}.color`, e.target.value)}
                  className="h-[34px] w-9 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
                  aria-label="Badge color"
                />
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => update("profile.badges", badges.filter((item) => item.id !== badge.id))}
                  aria-label="Remove badge"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        )}
      </Section>
    </>
  );
}
