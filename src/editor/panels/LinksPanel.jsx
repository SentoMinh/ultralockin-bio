import { useState } from "react";
import { Trash2 } from "lucide-react";
import { getPlatform, LINK_ICONS, PLATFORMS, PlatformIcon, platformColor } from "../../shared/platforms.jsx";
import { isOpenableLink, uid, visibleColor } from "../../shared/utils.js";
import { AddButton, Empty, iconButton, Section } from "../controls.jsx";
import { SortableList } from "../SortableList.jsx";

function PlatformPicker({ onPick, onClose }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = PLATFORMS.filter((platform) => platform.label.toLowerCase().includes(q));
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <input
        autoFocus
        className="ed-input"
        placeholder={`Search ${PLATFORMS.length} platforms…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && matches[0]) onPick(matches[0].id);
        }}
      />
      <div className="scroll-thin mt-2 grid max-h-60 grid-cols-4 gap-1 overflow-y-auto pr-1">
        {matches.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => onPick(platform.id)}
            title={platform.label}
            className="flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-[10px] text-white/60 transition hover:bg-white/[0.07] hover:text-white"
          >
            <PlatformIcon
              id={platform.id}
              className="h-5 w-5"
              style={{ color: visibleColor(platformColor(platform), true, "#e8e8ef") }}
            />
            <span className="w-full truncate text-center">{platform.label}</span>
          </button>
        ))}
        {matches.length === 0 && <p className="col-span-4 py-3 text-center text-xs text-white/40">No match.</p>}
      </div>
    </div>
  );
}

export default function LinksPanel({ config, update }) {
  const [picking, setPicking] = useState(false);
  const { socials, links } = config;

  const addSocial = (platform) => {
    update("socials", [...socials, { id: uid(), platform, value: "" }]);
    setPicking(false);
  };

  return (
    <>
      <Section
        title="Social icons"
        description="A link opens in a new tab. Anything else (a username, an email, a wallet) is copied when clicked."
        action={<AddButton onClick={() => setPicking((open) => !open)} label={picking ? "Close" : "Add"} />}
      >
        {picking && <PlatformPicker onPick={addSocial} onClose={() => setPicking(false)} />}
        {socials.length === 0 && !picking ? (
          <Empty>No social icons yet.</Empty>
        ) : (
          <SortableList
            items={socials}
            onReorder={(next) => update("socials", next)}
            renderItem={(social, index, handle) => {
              const platform = getPlatform(social.platform);
              const value = social.value.trim();
              return (
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-2">
                  <div className="flex items-center gap-2">
                    {handle}
                    <span
                      className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-white/[0.04]"
                      title={platform.label}
                    >
                      <PlatformIcon
                        id={social.platform}
                        className="h-[18px] w-[18px]"
                        style={{ color: visibleColor(platformColor(platform), true, "#e8e8ef") }}
                      />
                    </span>
                    <input
                      className="ed-input"
                      placeholder={platform.hint}
                      value={social.value}
                      onChange={(e) => update(`socials.${index}.value`, e.target.value)}
                      aria-label={`${platform.label} link or username`}
                    />
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => update("socials", socials.filter((item) => item.id !== social.id))}
                      aria-label={`Remove ${platform.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 pl-[72px] text-[11px] text-white/35">
                    {platform.label} ·{" "}
                    {value ? (isOpenableLink(value) ? "opens the link" : "copies the text") : "empty, hidden on the page"}
                  </p>
                </div>
              );
            }}
          />
        )}
      </Section>

      <Section
        title="Link cards"
        description="Bigger buttons for your main links."
        action={<AddButton onClick={() => update("links", [...links, { id: uid(), title: "", url: "", icon: "link" }])} />}
      >
        {links.length === 0 ? (
          <Empty>No link cards yet.</Empty>
        ) : (
          <SortableList
            items={links}
            onReorder={(next) => update("links", next)}
            renderItem={(link, index, handle) => (
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-2">
                <div className="flex items-center gap-2">
                  {handle}
                  <input
                    className="ed-input"
                    placeholder="Title"
                    value={link.title}
                    onChange={(e) => update(`links.${index}.title`, e.target.value)}
                    aria-label="Link title"
                  />
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => update("links", links.filter((item) => item.id !== link.id))}
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-[30px]">
                  <select
                    className="ed-input w-28 shrink-0"
                    value={link.icon}
                    onChange={(e) => update(`links.${index}.icon`, e.target.value)}
                    aria-label="Link icon"
                  >
                    {Object.keys(LINK_ICONS).map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <input
                    className="ed-input"
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) => update(`links.${index}.url`, e.target.value)}
                    aria-label="Link URL"
                  />
                </div>
              </div>
            )}
          />
        )}
      </Section>
    </>
  );
}
