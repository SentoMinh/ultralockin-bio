import { Trash2 } from "lucide-react";
import { uid } from "../../shared/utils.js";
import { AddButton, Empty, iconButton, MediaInput, Notice, Section, Slider, Toggle } from "../controls.jsx";
import { SortableList } from "../SortableList.jsx";

export default function MusicPanel({ config, update }) {
  const music = config.music;
  const tracks = music.tracks;
  const set = (key) => (value) => update(`music.${key}`, value);
  const addTrack = () =>
    update("music.tracks", [...tracks, { id: uid(), title: "", artist: "", url: "", cover: "" }]);

  return (
    <>
      {tracks.length > 0 && !config.effects.enterGate && (
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
          Browsers block sound until the visitor clicks. Turn on &ldquo;Click to enter&rdquo; so music can start.
        </Notice>
      )}

      <Section
        title="Tracks"
        description="Upload audio files or paste direct links (.mp3, .ogg, .wav)."
        action={<AddButton onClick={addTrack} />}
      >
        {tracks.length === 0 ? (
          <Empty>No tracks yet.</Empty>
        ) : (
          <SortableList
            items={tracks}
            onReorder={(next) => update("music.tracks", next)}
            renderItem={(track, index, handle) => (
              <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-black/20 p-2.5">
                <div className="flex items-center gap-2">
                  {handle}
                  <input
                    className="ed-input"
                    placeholder="Title"
                    value={track.title}
                    onChange={(e) => update(`music.tracks.${index}.title`, e.target.value)}
                    aria-label="Track title"
                  />
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => update("music.tracks", tracks.filter((item) => item.id !== track.id))}
                    aria-label="Remove track"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2.5 pl-[30px]">
                  <input
                    className="ed-input"
                    placeholder="Artist (optional)"
                    value={track.artist}
                    onChange={(e) => update(`music.tracks.${index}.artist`, e.target.value)}
                    aria-label="Artist"
                  />
                  <MediaInput
                    label="Audio"
                    value={track.url}
                    onChange={(value) => update(`music.tracks.${index}.url`, value)}
                    accept="audio/*"
                    kind="audio"
                  />
                  <MediaInput
                    label="Cover (optional)"
                    value={track.cover}
                    onChange={(value) => update(`music.tracks.${index}.cover`, value)}
                  />
                </div>
              </div>
            )}
          />
        )}
      </Section>

      <Section title="Player">
        <Toggle label="Show the player on the page" checked={music.showPlayer} onChange={set("showPlayer")} />
        <Toggle label="Shuffle" checked={music.shuffle} onChange={set("shuffle")} />
        <Slider
          label="Volume"
          value={music.volume}
          onChange={set("volume")}
          min={0}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Section>
    </>
  );
}
