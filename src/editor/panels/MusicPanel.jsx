import { useState } from "react";
import { Trash2 } from "lucide-react";
import { backgroundKind, formatClock, parseClock, streamEmbed, uid } from "../../shared/utils.js";
import { Field, iconButton, MediaInput, Notice, Section, Slider } from "../controls.jsx";
import { TrackRange } from "../TrackRange.jsx";

const BLANK = { id: "", url: "", start: 0 };

// A time typed as "1:30" (or plain seconds), stored as seconds. Empty means 0.
function ClockInput({ label, hint, value, onChange, placeholder }) {
  const [draft, setDraft] = useState(null);
  const commit = () => {
    if (draft === null) return;
    onChange(parseClock(draft));
    setDraft(null);
  };
  return (
    <Field label={label} hint={hint}>
      <input
        className="ed-input max-w-28"
        inputMode="numeric"
        placeholder={placeholder}
        aria-label={label}
        value={draft ?? (value > 0 ? formatClock(value) : "")}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
    </Field>
  );
}

// Tells the user how their link will be played.
function SourceNote({ url }) {
  const value = String(url ?? "").trim();
  if (!value) return null;
  const embed = streamEmbed(value);
  if (embed?.background) {
    return (
      <p className="text-[11px] leading-relaxed text-emerald-300/80">
        {embed.provider} link: plays as audio in the background. Nothing from {embed.provider} is shown on your page.
      </p>
    );
  }
  if (embed) {
    return (
      <p className="text-[11px] leading-relaxed text-amber-200/80">
        This {embed.provider} link can&apos;t play in the background, so it won&apos;t play on your page. Use a
        link to one YouTube video or one SoundCloud song, or upload the audio file.
      </p>
    );
  }
  if (/^https:\/\/[^/]*(youtube|youtu\.be|spotify|soundcloud|apple|deezer)/i.test(value)) {
    return (
      <p className="text-[11px] leading-relaxed text-amber-200/80">
        This link isn&apos;t recognized. Use the full link to one song, copied from the address bar.
      </p>
    );
  }
  return null;
}

export default function MusicPanel({ config, update }) {
  const music = config.music;
  // A page has one song; the first edit creates it.
  const track = music.tracks[0] ?? BLANK;
  const hasSong = Boolean(track.url.trim());
  const setTrack = (changes) => update("music.tracks", [{ ...track, id: track.id || uid(), ...changes }]);

  return (
    <>
      {hasSong && !config.effects.enterGate && (
        <Notice
          tone="warn"
          action={
            <button
              type="button"
              onClick={() => update("effects.enterGate", true)}
              className="shrink-0 rounded-md bg-amber-300/20 px-2 py-1 font-semibold text-amber-100 hover:bg-amber-300/30"
            >
              Turn on
            </button>
          }
        >
          Browsers block sound until the visitor clicks. Music starts on their first click anywhere; turn on
          &ldquo;Click to enter&rdquo; so it starts right as they open your page.
        </Notice>
      )}

      <Section
        title="Song"
        description="One song plays in the background. Your page shows no title or player for it, only a small sound button in the corner. Paste a YouTube or SoundCloud link, a direct audio link (.mp3, .ogg, .wav), or upload a file. Spotify, Apple Music and Deezer don't allow background playing, so their links won't work."
        action={
          music.tracks.length > 0 && (
            <button
              type="button"
              className={iconButton}
              onClick={() => update("music.tracks", [])}
              aria-label="Remove the song"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )
        }
      >
        <MediaInput
          label="Song link or file"
          value={track.url}
          onChange={(value) => setTrack({ url: value, start: 0 })}
          accept="audio/*"
          kind="audio"
        />
        <SourceNote url={track.url} />
        {backgroundKind(track.url) && (
          <>
            <Field label="Where the song starts">
              <TrackRange
                url={track.url}
                start={track.start}
                volume={music.volume}
                onChange={(start) => setTrack({ start })}
              />
            </Field>
            <ClockInput
              label="Start at"
              hint="Or type the time, like 0:45. The song plays from there to its end, then starts again."
              placeholder="0:00"
              value={track.start}
              onChange={(start) => setTrack({ start })}
            />
          </>
        )}
        <Slider
          label="Volume"
          value={music.volume}
          onChange={(value) => update("music.volume", value)}
          min={0}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Section>
    </>
  );
}
