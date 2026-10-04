import { BACKGROUND_EFFECTS, CURSOR_EFFECTS, NAME_EFFECTS } from "../../shared/config.js";
import { usePrefersReducedMotion } from "../../profile/hooks.js";
import { ColorInput, MediaInput, Notice, OptionGrid, Section, Slider, TextInput, Toggle } from "../controls.jsx";

export default function EffectsPanel({ config, update }) {
  const effects = config.effects;
  const set = (key) => (value) => update(`effects.${key}`, value);
  const reduced = usePrefersReducedMotion();

  return (
    <>
      {reduced && (
        <Notice tone="warn">
          Your system has &ldquo;reduce motion&rdquo; on, so cursor, name and background animations stay paused.
          On Windows: Settings → Accessibility → Visual effects → Animation effects.
        </Notice>
      )}

      <Section title="3D tilt" description="The card leans toward the mouse.">
        <Toggle label="Tilt on hover" checked={effects.tilt} onChange={set("tilt")} />
        {effects.tilt && (
          <>
            <Slider label="Max angle" value={effects.tiltMax} onChange={set("tiltMax")} min={2} max={20} format={(v) => `${v}°`} />
            <Toggle
              label="Shine (glare)"
              hint="A light sweep across the card. One-card layout only."
              checked={effects.tiltGlare}
              onChange={set("tiltGlare")}
            />
          </>
        )}
      </Section>

      <Section title="Cursor effect">
        <OptionGrid value={effects.cursor} onChange={set("cursor")} options={CURSOR_EFFECTS} />
        {effects.cursor === "emoji" && (
          <TextInput label="Emoji" hint="A few emoji; they burst out as the mouse moves." value={effects.cursorEmoji} onChange={set("cursorEmoji")} />
        )}
        <MediaInput
          label="Custom cursor image"
          hint=".cur or a small .png (32 × 32 works best). Links keep the hand cursor."
          value={effects.cursorImage}
          onChange={set("cursorImage")}
          accept=".cur,.png,.svg,image/*"
        />
      </Section>

      <Section title="Name effect">
        <OptionGrid value={effects.nameEffect} onChange={set("nameEffect")} options={NAME_EFFECTS} />
        {effects.nameEffect === "sparkle" && (
          <div className="grid grid-cols-2 gap-3">
            <ColorInput label="Sparkle color" value={effects.sparkleColor} onChange={set("sparkleColor")} />
          </div>
        )}
      </Section>

      <Section title="Background effect">
        <OptionGrid value={effects.background} onChange={set("background")} options={BACKGROUND_EFFECTS} />
      </Section>

      <Section title="Page">
        <Toggle
          label="Entrance animation"
          hint="Sections slide in when the page opens. Replay it with ↻ above the preview."
          checked={effects.entrance}
          onChange={set("entrance")}
        />
        <Toggle
          label="Click to enter"
          hint="A splash screen visitors click first. Needed for music, since browsers block sound until a click."
          checked={effects.enterGate}
          onChange={set("enterGate")}
        />
        {effects.enterGate && <TextInput label="Splash text" value={effects.enterText} onChange={set("enterText")} />}
      </Section>
    </>
  );
}
