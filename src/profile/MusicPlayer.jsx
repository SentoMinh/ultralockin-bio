import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useMediaUrl } from "../shared/media.js";
import { backgroundKind, clamp, hexToRgba } from "../shared/utils.js";
import { createDriver, playErrorText } from "./audioDrivers.js";

const IDLE = { key: "", playing: false, error: "" };

// One song, played as background audio with nothing shown for it: an uploaded file,
// a direct audio link, a YouTube video or a SoundCloud song. It starts at the chosen
// second, plays to its end, then starts over from there. Links that can't play
// hidden (Spotify, playlists, ...) are ignored.
export function useMusic(music) {
  const track = music.tracks.find((item) => backgroundKind(item.url)) ?? null;
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState(IDLE);
  const driverRef = useRef(null);
  const wantsPlay = useRef(false);
  const volumeRef = useRef(0);
  const kind = backgroundKind(track?.url);
  const fileUrl = useMediaUrl(kind === "file" ? track.url : "");
  const url = kind === "file" ? fileUrl : (track?.url ?? "");
  const start = track?.start > 0 ? track.start : 0;
  const volume = muted ? 0 : clamp(music.volume, 0, 1);
  const key = url ? `${url}|${start}` : "";
  const live = status.key === key ? status : IDLE;

  useEffect(() => {
    volumeRef.current = volume;
    driverRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!key) return undefined;
    const driver = createDriver(
      kind,
      { url, start, autoplay: wantsPlay.current, volume: volumeRef.current },
      {
        onTime: () => {},
        onPlaying: (playing) => setStatus({ key, playing, error: "" }),
        onEnded: () => {
          driver.seek(start);
          driver.play();
        },
        onError: (error) => setStatus({ key, playing: false, error }),
      },
    );
    driverRef.current = driver;
    return () => {
      driverRef.current = null;
      driver.destroy();
    };
  }, [key, kind, url, start]);

  const play = useCallback(() => {
    wantsPlay.current = true;
    driverRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    wantsPlay.current = false;
    driverRef.current?.pause();
  }, []);

  return { hasTrack: Boolean(track), playing: live.playing, muted, error: live.error, setMuted, play, pause };
}

// The only thing the page shows for its music: a small button that lets visitors
// silence it, or start it if the browser held it back. `showError` is on in the
// editor's preview, so the owner sees why a song won't play.
export function SoundToggle({ player, theme, showError = false }) {
  const { playing, muted } = player;
  const silent = muted || !playing;
  const problem = showError && player.error ? playErrorText(player.error) : "";

  return (
    <div className="fixed top-4 left-4 z-20 flex items-center gap-2">
      <button
        type="button"
        aria-label={silent ? "Turn music on" : "Turn music off"}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full backdrop-blur-md transition hover:brightness-125"
        style={{
          color: theme.text,
          background: hexToRgba(theme.cardColor, 0.55),
          border: `1px solid ${hexToRgba(theme.borderColor, theme.borderOpacity)}`,
        }}
        onClick={() => {
          if (playing) {
            player.setMuted(!muted);
            return;
          }
          player.setMuted(false);
          player.play();
        }}
      >
        {silent ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      {problem && <p className="max-w-[240px] text-xs leading-snug text-amber-300">{problem}</p>}
    </div>
  );
}
