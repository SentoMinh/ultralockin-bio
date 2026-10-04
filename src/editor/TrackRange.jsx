import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { createDriver, playErrorText } from "../profile/audioDrivers.js";
import { useMediaUrl } from "../shared/media.js";
import { AUDIO_CHANNEL } from "../shared/storage.js";
import { backgroundKind, clamp, formatClock } from "../shared/utils.js";

// `atStart`: the next play begins at the chosen start instead of resuming.
const IDLE = { source: "", current: 0, duration: 0, playing: false, atStart: true, error: "" };

// The page preview next to the editor plays the song too. Starting one pauses the other.
let stopPreview = null;
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(AUDIO_CHANNEL);
if (channel) channel.onmessage = () => stopPreview?.();

// Waits until typing stops, so half-typed links are never loaded.
function useSettled(value, delay) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

// The song's playing bar, like the one in a music app: play the song, then press or
// drag on the bar to choose the second it starts at. `onChange` gets that second.
export function TrackRange({ url, start, volume, onChange }) {
  const link = useSettled(String(url ?? "").trim(), 500);
  const kind = backgroundKind(link);
  const fileUrl = useMediaUrl(kind === "file" ? link : "");
  const source = kind === "file" ? fileUrl : link;
  const [live, setLive] = useState(IDLE);
  const [dragged, setDragged] = useState(null);
  const barRef = useRef(null);
  const driverRef = useRef(null);
  const volumeRef = useRef(volume);
  const shown = live.source === source ? live : IDLE;

  useEffect(() => {
    volumeRef.current = volume;
    driverRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!kind || !source) return undefined;
    // Unchanged values keep the old state, so an idle bar causes no re-renders.
    const patch = (changes) =>
      setLive((prev) => {
        const base = prev.source === source ? prev : { ...IDLE, source };
        const same = base === prev && Object.keys(changes).every((name) => prev[name] === changes[name]);
        return same ? prev : { ...base, ...changes };
      });
    const driver = createDriver(
      kind,
      { url: source, start: 0, autoplay: false, volume: volumeRef.current },
      {
        onTime: (current, duration) => patch({ current, duration }),
        onPlaying: (playing) => patch(playing ? { playing, atStart: false, error: "" } : { playing }),
        onEnded: () => patch({ playing: false, atStart: true }),
        onError: (error) => patch({ playing: false, error }),
      },
    );
    driverRef.current = driver;
    return () => {
      if (stopPreview === driver.pause) stopPreview = null;
      driverRef.current = null;
      driver.destroy();
    };
  }, [kind, source]);

  if (!kind) return null;

  const total = shown.duration;
  const startAt = clamp(dragged ?? start, 0, total);
  const fromStart = !shown.playing && (shown.atStart || shown.current <= startAt);
  const playhead = fromStart ? startAt : Math.max(shown.current, startAt);
  const percent = (seconds) => (total ? `${(seconds / total) * 100}%` : "0%");
  const limit = (value) => clamp(value, 0, Math.max(Math.floor(total) - 1, 0));

  const toggle = () => {
    const driver = driverRef.current;
    if (!driver) return;
    if (shown.playing) {
      driver.pause();
      return;
    }
    if (stopPreview && stopPreview !== driver.pause) stopPreview();
    stopPreview = driver.pause;
    channel?.postMessage("bar");
    if (fromStart) driver.seek(startAt);
    driver.play();
  };

  // While the song plays it jumps to the new start, so you hear where it begins.
  const moveStart = (value) => {
    onChange(value);
    if (shown.playing) driverRef.current?.seek(value);
    else setLive((prev) => (prev.source === source ? { ...prev, atStart: true } : prev));
  };

  const onPointerDown = (event) => {
    if (!total || event.button > 0) return;
    event.preventDefault();
    const rect = barRef.current.getBoundingClientRect();
    const valueAt = (clientX) => limit(Math.round(clamp((clientX - rect.left) / rect.width, 0, 1) * total));
    let value = valueAt(event.clientX);
    setDragged(value);
    const onMove = (moveEvent) => {
      value = valueAt(moveEvent.clientX);
      setDragged(value);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragged(null);
      moveStart(value);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onKeyDown = (event) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (!step || !total) return;
    event.preventDefault();
    moveStart(limit(Math.round(startAt) + step * (event.shiftKey ? 5 : 1)));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={!total}
          aria-label={shown.playing ? "Pause the song" : "Play the song"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
        >
          {shown.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-px" />}
        </button>
        <span className="w-9 shrink-0 text-right text-[11px] text-white/60 tabular-nums">
          {formatClock(dragged === null ? playhead : startAt)}
        </span>
        <div
          ref={barRef}
          onPointerDown={onPointerDown}
          className={`relative h-5 min-w-0 flex-1 touch-none select-none ${total ? "cursor-pointer" : "opacity-40"}`}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#7c6cff]/60"
            style={{ left: percent(startAt), right: 0 }}
          />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white"
            style={{ left: percent(startAt), width: percent(playhead - startAt) }}
          />
          <button
            type="button"
            role="slider"
            aria-label="Where the song starts"
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(startAt)}
            aria-valuetext={formatClock(startAt)}
            disabled={!total}
            onKeyDown={onKeyDown}
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow outline-none focus-visible:ring-2 focus-visible:ring-[#7c6cff]"
            style={{ left: percent(startAt) }}
          />
        </div>
        <span className="w-9 shrink-0 text-[11px] text-white/60 tabular-nums">{total ? formatClock(total) : "–:––"}</span>
      </div>
      <p className={`text-[11px] leading-relaxed ${shown.error ? "text-amber-200/80" : "text-white/35"}`}>
        {shown.error
          ? playErrorText(shown.error)
          : total
            ? "Press or drag on the bar where the song should start. Play it to listen."
            : "Loading the song…"}
      </p>
    </div>
  );
}
