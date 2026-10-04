import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Maximize2, Monitor, RotateCw, Smartphone, Tablet } from "lucide-react";
import { SITE_HOST } from "../shared/api.js";
import { MSG } from "../shared/storage.js";

const DEVICES = [
  { id: "fit", label: "Fit to panel", icon: Maximize2 },
  { id: "desktop", label: "Desktop 1440×900", icon: Monitor, width: 1440, height: 900 },
  { id: "tablet", label: "Tablet 834×1112", icon: Tablet, width: 834, height: 1112 },
  { id: "mobile", label: "Phone 390×844", icon: Smartphone, width: 390, height: 844 },
];
const PAD = 24;

// The preview is the real profile page in an iframe, so fixed backgrounds,
// cursor effects and the splash screen behave exactly like the live page.
export default function PreviewPane({
  config,
  device,
  onDeviceChange,
  blockPointer,
  sampleActivity,
  publishedUsername,
}) {
  // Editor-only preview switches travel next to the config, never inside it.
  const options = useMemo(
    () => ({ sampleActivity: Boolean(sampleActivity), publishedUsername: publishedUsername ?? "" }),
    [sampleActivity, publishedUsername],
  );
  const iframeRef = useRef(null);
  const stageRef = useRef(null);
  const messageRef = useRef({ config, options });
  const readyRef = useRef(false);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [title, setTitle] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const post = useCallback((message) => {
    iframeRef.current?.contentWindow?.postMessage({ type: MSG.config, ...message }, window.location.origin);
  }, []);

  useEffect(() => {
    messageRef.current = { config, options };
    if (readyRef.current) post(messageRef.current);
  }, [config, options, post]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === MSG.ready) {
        readyRef.current = true;
        post(messageRef.current);
      } else if (event.data?.type === MSG.title) {
        setTitle(String(event.data.title ?? ""));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const replay = () => {
    readyRef.current = false;
    setReloadKey((key) => key + 1);
  };

  const preset = DEVICES.find((item) => item.id === device) ?? DEVICES[0];
  const availableWidth = Math.max(stage.width - PAD * 2, 200);
  const availableHeight = Math.max(stage.height - PAD * 2, 200);
  const frameWidth = preset.width ?? availableWidth;
  const frameHeight = preset.height ?? availableHeight;
  const scale = preset.width ? Math.min(1, availableWidth / frameWidth, availableHeight / frameHeight) : 1;

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#060609]">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] px-3">
        <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.06] bg-black/30 p-0.5">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={device === id}
              onClick={() => onDeviceChange(id)}
              className={`grid h-7 w-8 place-items-center rounded-md transition ${
                device === id ? "bg-white/[0.12] text-white" : "text-white/45 hover:text-white/80"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="mx-auto flex min-w-0 max-w-[60%] items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/80" title="Live preview" />
          <span className="truncate font-medium text-white/80">{title || config.profile.pageTitle || "…"}</span>
          <span className="shrink-0 text-white/25">·</span>
          <span className="truncate text-white/40">
            {SITE_HOST}/{config.profile.username || "you"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={replay}
            title="Replay intro (reload preview)"
            aria-label="Replay intro"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          {publishedUsername && (
            <a
              href={`/${publishedUsername}`}
              target="_blank"
              rel="noopener"
              title="Open your published page in a new tab"
              aria-label="Open published page"
              className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {stage.width > 0 && (
          <div
            className="absolute overflow-hidden rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
            style={{
              width: frameWidth * scale,
              height: frameHeight * scale,
              left: (stage.width - frameWidth * scale) / 2,
              top: (stage.height - frameHeight * scale) / 2,
            }}
          >
            <iframe
              key={reloadKey}
              ref={iframeRef}
              src="/profile"
              title="Live preview"
              allow="autoplay; clipboard-write; fullscreen"
              style={{
                width: frameWidth,
                height: frameHeight,
                border: 0,
                display: "block",
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }}
            />
          </div>
        )}
        {blockPointer && <div className="absolute inset-0 cursor-col-resize" />}
        {preset.width && (
          <div className="pointer-events-none absolute right-3 bottom-2 text-[11px] text-white/30">
            {preset.width}×{preset.height} · {Math.round(scale * 100)}%
          </div>
        )}
      </div>
    </section>
  );
}
