import { useCallback, useEffect, useRef, useState } from "react";
import { Music, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useMediaUrl } from "../shared/media.js";
import { formatClock, hexToRgba, luminance } from "../shared/utils.js";

export function usePlaylist(music) {
  const tracks = music.tracks.filter((track) => track.url);
  const count = tracks.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const audioRef = useRef(null);
  const wantsPlay = useRef(false);
  const track = count ? tracks[index % count] : null;
  const src = useMediaUrl(track?.url);
  const cover = useMediaUrl(track?.cover);

  const audio = useCallback(() => {
    audioRef.current ??= new Audio();
    return audioRef.current;
  }, []);

  const next = useCallback(() => {
    if (!count) return;
    setIndex((i) =>
      music.shuffle && count > 1 ? (i + 1 + Math.floor(Math.random() * (count - 1))) % count : (i + 1) % count,
    );
  }, [count, music.shuffle]);

  const prev = useCallback(() => {
    if (count) setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    const element = audio();
    const onTime = () =>
      setTime({
        current: element.currentTime,
        duration: Number.isFinite(element.duration) ? element.duration : 0,
      });
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    element.addEventListener("timeupdate", onTime);
    element.addEventListener("loadedmetadata", onTime);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    return () => {
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("loadedmetadata", onTime);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.pause();
    };
  }, [audio]);

  useEffect(() => {
    const element = audio();
    const onEnded = () => {
      wantsPlay.current = true;
      next();
    };
    element.addEventListener("ended", onEnded);
    return () => element.removeEventListener("ended", onEnded);
  }, [audio, next]);

  useEffect(() => {
    audio().volume = Math.min(Math.max(music.volume, 0), 1);
  }, [audio, music.volume]);

  useEffect(() => {
    audio().muted = muted;
  }, [audio, muted]);

  useEffect(() => {
    const element = audio();
    if (!src) {
      element.pause();
      element.removeAttribute("src");
      return;
    }
    if (element.getAttribute("src") === src) return;
    element.src = src;
    if (wantsPlay.current) element.play().catch(() => setPlaying(false));
  }, [audio, src]);

  const play = useCallback(() => {
    wantsPlay.current = true;
    audio().play().catch(() => setPlaying(false));
  }, [audio]);

  const pause = useCallback(() => {
    wantsPlay.current = false;
    audio().pause();
  }, [audio]);

  const seek = useCallback(
    (ratio) => {
      const element = audio();
      if (Number.isFinite(element.duration)) element.currentTime = ratio * element.duration;
    },
    [audio],
  );

  return {
    hasTracks: count > 0,
    track,
    cover,
    playing,
    muted,
    time,
    setMuted,
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    next,
    prev,
    seek,
  };
}

export default function MusicPlayer({ player, theme, tile }) {
  const { track, cover, playing, muted, time } = player;
  const progress = time.duration ? (time.current / time.duration) * 100 : 0;
  const onAccent = luminance(theme.accent) > 0.5 ? "#000000" : "#ffffff";
  const control = "grid h-9 w-9 place-items-center rounded-full transition hover:brightness-125";

  return (
    <div className="flex items-center gap-3 p-3" style={tile}>
      <div
        className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden"
        style={{ borderRadius: Math.max(theme.radius - 2, 6), background: hexToRgba(theme.accent, 0.2) }}
      >
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <Music className="h-6 w-6 opacity-80" />}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold">{track?.title || "Untitled track"}</p>
        {track?.artist && <p className="truncate text-xs opacity-60">{track.artist}</p>}
        <div className="mt-2 flex items-center gap-2 text-[10px] tabular-nums opacity-80">
          <span>{formatClock(time.current)}</span>
          <button
            type="button"
            aria-label="Seek"
            className="h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ background: hexToRgba(theme.text, 0.15) }}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              player.seek((event.clientX - rect.left) / rect.width);
            }}
          >
            <span className="block h-full rounded-full" style={{ width: `${progress}%`, background: theme.accent }} />
          </button>
          <span>{formatClock(time.duration)}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button type="button" className={control} onClick={player.prev} aria-label="Previous track">
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={control}
          onClick={player.toggle}
          aria-label={playing ? "Pause" : "Play"}
          style={{ background: theme.accent, color: onAccent }}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>
        <button type="button" className={control} onClick={player.next} aria-label="Next track">
          <SkipForward className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={control}
          onClick={() => player.setMuted(!muted)}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
