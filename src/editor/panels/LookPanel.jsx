import { useEffect } from "react";
import { AtSign, Link2, MessageCircle, Music } from "lucide-react";
import {
  applyPreset,
  BACKGROUND_TYPES,
  FONTS,
  LAYOUTS,
  PRESETS,
  SECTION_LABELS,
} from "../../shared/config.js";
import { ColorInput, MediaInput, Section, Segmented, Slider, Toggle } from "../controls.jsx";
import { SortableList } from "../SortableList.jsx";

const SECTION_ICONS = { socials: AtSign, links: Link2, discord: MessageCircle, music: Music };

function FontPicker({ value, onChange }) {
  // One stylesheet for every family so each button previews its own font.
  useEffect(() => {
    const id = "bio-editor-font-previews";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${FONTS.map((font) => `family=${font.css}`).join("&")}&display=swap`;
    document.head.appendChild(link);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {FONTS.map((font) => (
        <button
          key={font.name}
          type="button"
          onClick={() => onChange(font.name)}
          aria-pressed={value === font.name}
          style={{ fontFamily: `"${font.name}", sans-serif` }}
          className={`truncate rounded-lg border px-2.5 py-2 text-left text-[13px] transition ${
            value === font.name
              ? "border-[#7c6cff] bg-[#7c6cff]/15 text-white"
              : "border-white/[0.07] bg-black/20 text-white/75 hover:border-white/20"
          }`}
        >
          {font.name}
        </button>
      ))}
    </div>
  );
}

export default function LookPanel({ config, update, replace }) {
  const theme = config.theme;
  const background = theme.background;
  const set = (key) => (value) => update(`theme.${key}`, value);
  const setBackground = (key) => (value) => update(`theme.background.${key}`, value);
  const percent = (v) => `${Math.round(v * 100)}%`;

  return (
    <>
      <Section title="Presets" description="A starting look. Changes colors, font and effects, never your text or links.">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => replace(applyPreset(config, preset))}
              className="rounded-xl border border-white/[0.07] bg-black/20 p-2 text-left transition hover:border-white/25"
            >
              <span className="flex h-9 overflow-hidden rounded-lg ring-1 ring-white/10">
                {preset.colors.map((color) => (
                  <span key={color} className="flex-1" style={{ background: color }} />
                ))}
              </span>
              <span className="mt-1.5 block text-xs font-medium text-white/80">{preset.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Accent" value={theme.accent} onChange={set("accent")} />
          <ColorInput label="Text" value={theme.text} onChange={set("text")} />
          <ColorInput label="Icons" value={theme.iconColor} onChange={set("iconColor")} />
          <ColorInput label="Borders" value={theme.borderColor} onChange={set("borderColor")} />
        </div>
        <Toggle
          label="Brand-colored icons"
          hint="Spotify green, Discord blurple, and so on."
          checked={theme.brandColors}
          onChange={set("brandColors")}
        />
        <Toggle label="Icon glow" checked={theme.iconGlow} onChange={set("iconGlow")} />
      </Section>

      <Section title="Font">
        <FontPicker value={theme.font} onChange={set("font")} />
      </Section>

      <Section title="Card">
        <Segmented label="Layout" value={theme.layout} onChange={set("layout")} options={LAYOUTS} />
        <Slider label="Width" value={theme.width} onChange={set("width")} min={380} max={760} step={10} format={(v) => `${v}px`} />
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Card color" value={theme.cardColor} onChange={set("cardColor")} />
        </div>
        <Slider
          label="Card opacity"
          hint="Low values plus blur give the glass look."
          value={theme.cardOpacity}
          onChange={set("cardOpacity")}
          min={0}
          max={1}
          step={0.05}
          format={percent}
        />
        <Slider label="Glass blur" value={theme.cardBlur} onChange={set("cardBlur")} min={0} max={40} format={(v) => `${v}px`} />
        <Slider label="Border width" value={theme.borderWidth} onChange={set("borderWidth")} min={0} max={4} format={(v) => `${v}px`} />
        <Slider label="Border opacity" value={theme.borderOpacity} onChange={set("borderOpacity")} min={0} max={1} step={0.05} format={percent} />
        <Slider label="Corner radius" value={theme.radius} onChange={set("radius")} min={0} max={32} format={(v) => `${v}px`} />
        <Toggle label="Card glow" hint="Soft shadow in your accent color." checked={theme.cardGlow} onChange={set("cardGlow")} />
        <Toggle label="Round social icons" checked={theme.roundSocials} onChange={set("roundSocials")} />
      </Section>

      <Section title="Background">
        <Segmented value={background.type} onChange={setBackground("type")} options={BACKGROUND_TYPES} />
        <div className="grid grid-cols-2 gap-3">
          <ColorInput
            label={background.type === "gradient" ? "From" : "Color"}
            value={background.color}
            onChange={setBackground("color")}
          />
          {background.type === "gradient" && (
            <ColorInput label="To" value={background.color2} onChange={setBackground("color2")} />
          )}
        </div>
        {background.type === "gradient" && (
          <Slider label="Angle" value={background.angle} onChange={setBackground("angle")} min={0} max={360} format={(v) => `${v}°`} />
        )}
        {(background.type === "image" || background.type === "video") && (
          <MediaInput
            key={background.type}
            label={background.type === "video" ? "Video (MP4 or WebM, plays muted)" : "Image or GIF"}
            value={background.url}
            onChange={setBackground("url")}
            accept={background.type === "video" ? "video/*" : "image/*"}
            kind={background.type}
          />
        )}
        <Slider label="Background blur" value={background.blur} onChange={setBackground("blur")} min={0} max={40} format={(v) => `${v}px`} />
        <Slider label="Brightness" value={background.brightness} onChange={setBackground("brightness")} min={20} max={130} format={(v) => `${v}%`} />
      </Section>

      <Section title="Section order" description="Drag to reorder what shows under your name.">
        <SortableList
          items={config.sections}
          getId={(id) => id}
          onReorder={(next) => update("sections", next)}
          renderItem={(id, index, handle) => {
            const Icon = SECTION_ICONS[id];
            return (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-1.5 pr-3">
                {handle}
                <Icon className="h-4 w-4 text-white/45" />
                <span className="text-[13px] text-white/80">{SECTION_LABELS[id]}</span>
              </div>
            );
          }}
        />
      </Section>
    </>
  );
}
