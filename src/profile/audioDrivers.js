import { streamEmbed } from "../shared/utils.js";

// Background audio sources behind one small interface, so the page drives uploaded
// files, YouTube videos and SoundCloud songs the same way.
//
//   createDriver(kind, source, events) -> { play, pause, seek, setVolume, destroy }
//   source: { url, start, autoplay, volume }   start in seconds, volume 0-1
//   events: onTime(current, duration), onPlaying(bool), onEnded(), onError(code)
//
// YouTube and SoundCloud play through their official players, kept off-screen.

const scripts = new Map();

function loadScript(src) {
  if (!scripts.has(src)) {
    scripts.set(
      src,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => {
          scripts.delete(src);
          script.remove();
          reject(new Error("script_failed"));
        };
        document.head.appendChild(script);
      }),
    );
  }
  return scripts.get(src);
}

let stage;

// Off-screen rather than display:none, which stops some browsers from playing.
function hiddenStage() {
  if (!stage?.isConnected) {
    stage = document.createElement("div");
    stage.setAttribute("aria-hidden", "true");
    stage.style.cssText =
      "position:fixed;left:-9999px;top:0;width:320px;height:200px;opacity:0;pointer-events:none;overflow:hidden";
    document.body.appendChild(stage);
  }
  return stage;
}

function fileDriver({ url, start, autoplay, volume }, events) {
  const audio = new Audio();
  const report = () => events.onTime(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0);
  const onMeta = () => {
    if (start > 0 && start < audio.duration) audio.currentTime = start;
    report();
  };
  const onPlay = () => events.onPlaying(true);
  const onPause = () => events.onPlaying(false);
  const onEnded = () => events.onEnded();
  const onError = () => events.onError("file");
  const play = () => audio.play().catch(() => events.onPlaying(false));
  const listeners = [
    ["timeupdate", report],
    ["loadedmetadata", onMeta],
    ["play", onPlay],
    ["pause", onPause],
    ["ended", onEnded],
    ["error", onError],
  ];
  for (const [name, handler] of listeners) audio.addEventListener(name, handler);
  audio.volume = volume;
  audio.src = url;
  if (autoplay) play();

  return {
    play,
    pause: () => audio.pause(),
    seek: (seconds) => {
      audio.currentTime = seconds;
    },
    setVolume: (value) => {
      audio.volume = value;
    },
    destroy: () => {
      for (const [name, handler] of listeners) audio.removeEventListener(name, handler);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}

let youTubeReady;

function youTubeApi() {
  youTubeReady ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    loadScript("https://www.youtube.com/iframe_api").catch((error) => {
      youTubeReady = undefined;
      reject(error);
    });
  });
  return youTubeReady;
}

function youTubeDriver({ url, start, autoplay, volume }, events) {
  const { videoId } = streamEmbed(url);
  const mount = document.createElement("div");
  hiddenStage().appendChild(mount);
  let player = null;
  let ready = false;
  let dead = false;
  let wantsPlay = autoplay;
  let level = volume;
  let timer = 0;

  youTubeApi()
    .then((YT) => {
      if (dead) return;
      player = new YT.Player(mount, {
        width: 320,
        height: 200,
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: { autoplay: autoplay ? 1 : 0, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, start: Math.floor(start) },
        events: {
          onReady: () => {
            if (dead) return;
            ready = true;
            player.getIframe().tabIndex = -1;
            player.setVolume(level * 100);
            if (wantsPlay) player.playVideo();
            timer = window.setInterval(() => events.onTime(player.getCurrentTime() || 0, player.getDuration() || 0), 250);
          },
          onStateChange: ({ data }) => {
            if (dead) return;
            if (data === YT.PlayerState.PLAYING) events.onPlaying(true);
            else if (data === YT.PlayerState.PAUSED) events.onPlaying(false);
            else if (data === YT.PlayerState.ENDED) {
              events.onPlaying(false);
              events.onEnded();
            }
          },
          onError: ({ data }) => {
            if (!dead) events.onError(`youtube_${data}`);
          },
        },
      });
    })
    .catch(() => {
      if (!dead) events.onError("youtube_api");
    });

  return {
    play: () => {
      wantsPlay = true;
      if (ready) player.playVideo();
    },
    pause: () => {
      wantsPlay = false;
      if (ready) player.pauseVideo();
    },
    seek: (seconds) => {
      if (ready) player.seekTo(seconds, true);
    },
    setVolume: (value) => {
      level = value;
      if (ready) player.setVolume(value * 100);
    },
    destroy: () => {
      dead = true;
      window.clearInterval(timer);
      if (player?.destroy) player.destroy();
      else mount.remove();
    },
  };
}

function soundCloudDriver({ url, start, autoplay, volume }, events) {
  const embed = streamEmbed(url);
  const iframe = document.createElement("iframe");
  iframe.allow = "autoplay";
  iframe.tabIndex = -1;
  iframe.width = "320";
  iframe.height = "166";
  let widget = null;
  let dead = false;
  let wantsPlay = autoplay;
  let level = volume;
  let duration = 0;
  // The widget can only jump to a position while the song is running, so a
  // position asked for at any other moment waits here until it starts.
  let running = false;
  let pending = start > 0 ? start : null;

  loadScript("https://w.soundcloud.com/player/api.js")
    .then(() => {
      if (dead) return;
      const { Widget } = window.SC;
      iframe.src = embed.src;
      hiddenStage().appendChild(iframe);
      const created = Widget(iframe);
      created.bind(Widget.Events.READY, () => {
        if (dead) return;
        widget = created;
        widget.setVolume(level * 100);
        widget.getDuration((ms) => {
          duration = ms / 1000;
          if (!dead) events.onTime(0, duration);
        });
        if (wantsPlay) widget.play();
      });
      created.bind(Widget.Events.PLAY, () => {
        if (dead) return;
        running = true;
        if (pending !== null) {
          created.seekTo(pending * 1000);
          pending = null;
        }
        events.onPlaying(true);
      });
      created.bind(Widget.Events.PAUSE, () => {
        if (dead) return;
        running = false;
        events.onPlaying(false);
      });
      created.bind(Widget.Events.FINISH, () => {
        if (dead) return;
        running = false;
        events.onPlaying(false);
        events.onEnded();
      });
      created.bind(Widget.Events.PLAY_PROGRESS, (progress) => {
        if (!dead && pending === null) events.onTime(progress.currentPosition / 1000, duration);
      });
      created.bind(Widget.Events.ERROR, () => {
        if (!dead) events.onError("soundcloud");
      });
    })
    .catch(() => {
      if (!dead) events.onError("soundcloud_api");
    });

  return {
    play: () => {
      wantsPlay = true;
      widget?.play();
    },
    pause: () => {
      wantsPlay = false;
      widget?.pause();
    },
    seek: (seconds) => {
      if (running) widget.seekTo(seconds * 1000);
      else pending = seconds;
    },
    setVolume: (value) => {
      level = value;
      widget?.setVolume(value * 100);
    },
    destroy: () => {
      dead = true;
      iframe.remove();
    },
  };
}

// Why a song didn't play, in words for the page's owner.
export function playErrorText(code) {
  if (code === "youtube_101" || code === "youtube_150") return "The owner of this YouTube video blocks playing it on other sites.";
  if (code === "youtube_100" || code === "youtube_2") return "This YouTube video wasn't found, or it's private.";
  if (code.startsWith("youtube") || code.startsWith("soundcloud")) return "This song can't be played from that link.";
  return "This audio file can't be played.";
}

const DRIVERS = { file: fileDriver, youtube: youTubeDriver, soundcloud: soundCloudDriver };

export const createDriver = (kind, source, events) => DRIVERS[kind](source, events);
