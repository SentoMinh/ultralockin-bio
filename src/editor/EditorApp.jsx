import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  Download,
  ExternalLink,
  FileUp,
  Link2,
  LoaderCircle,
  Music,
  Palette,
  Redo2,
  RotateCcw,
  Settings,
  Sparkles,
  Undo2,
  Upload,
  User,
} from "lucide-react";
import { siDiscord } from "simple-icons";
import { api, describeError, SITE_HOST, SITE_NAME } from "../shared/api.js";
import { normalizeConfig } from "../shared/config.js";
import {
  clearDraft,
  downloadConfig,
  loadDraft,
  loadLegacyConfig,
  loadUi,
  readConfigFile,
  sameConfig,
  saveDraft,
  saveUi,
  starterFor,
} from "../shared/storage.js";
import { clamp, getIn, setIn } from "../shared/utils.js";
import AccountPanel from "./panels/AccountPanel.jsx";
import DiscordPanel from "./panels/DiscordPanel.jsx";
import EffectsPanel from "./panels/EffectsPanel.jsx";
import LinksPanel from "./panels/LinksPanel.jsx";
import LookPanel from "./panels/LookPanel.jsx";
import MusicPanel from "./panels/MusicPanel.jsx";
import ProfilePanel from "./panels/ProfilePanel.jsx";
import PreviewPane from "./PreviewPane.jsx";
import { useHistoryState } from "./useHistoryState.js";

function DiscordGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={siDiscord.path} />
    </svg>
  );
}

const TABS = [
  { id: "profile", label: "Profile", icon: User, Panel: ProfilePanel, blurb: "Name, avatar, banner, bio text and badges." },
  { id: "links", label: "Links", icon: Link2, Panel: LinksPanel, blurb: "Social icons and link cards." },
  { id: "look", label: "Look", icon: Palette, Panel: LookPanel, blurb: "Presets, colors, font, card and background." },
  { id: "effects", label: "Effects", icon: Sparkles, Panel: EffectsPanel, blurb: "Tilt, cursor, name and background effects." },
  { id: "discord", label: "Discord", icon: DiscordGlyph, Panel: DiscordPanel, blurb: "Live status, activity and Spotify through Lanyard." },
  { id: "music", label: "Music", icon: Music, Panel: MusicPanel, blurb: "Tracks and the music player." },
  { id: "account", label: "Account", icon: Settings, Panel: AccountPanel, blurb: "Your login, your page link and invites." },
];

// Where editing starts: unpublished edits first, then the published profile.
// A profile made in the old local-only editor is picked up once, for the same
// Discord account only.
function initialConfig({ user, profile }) {
  const draft = loadDraft(user.id, profile?.updatedAt ?? null);
  if (draft) return draft;
  if (profile) return normalizeConfig(profile.config);
  const legacy = loadLegacyConfig();
  if (legacy && legacy.discord.userId === user.discordId) return legacy;
  return starterFor(user);
}

const RAIL_WIDTH = 76;
const UI_DEFAULTS = { tab: "profile", panelWidth: 430, device: "fit", sampleActivity: false };

function ToolbarButton({ title, onClick, disabled, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function TextButton({ onClick, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${
        danger
          ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
          : "border-white/[0.08] text-white/70 hover:border-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SaveBadge({ state, dirty }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-rose-300" title="Browser storage is full or blocked">
        <CircleAlert className="h-3.5 w-3.5" /> Not saved
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-white/40"
      title="Your edits are kept in this browser until you publish"
    >
      <Check className="h-3.5 w-3.5 text-emerald-400/80" /> {dirty ? "Draft saved" : "Up to date"}
    </span>
  );
}

export default function EditorApp({ session }) {
  const history = useHistoryState(() => initialConfig(session));
  const { value: config, set, undo, redo } = history;
  const [ui, setUi] = useState(() => loadUi(UI_DEFAULTS));
  const [saveState, setSaveState] = useState("saved");
  const [published, setPublished] = useState(session.profile);
  const [publishing, setPublishing] = useState(false);
  const dirty = useMemo(() => !published || !sameConfig(published.config, config), [published, config]);
  const [resizing, setResizing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [flash, setFlash] = useState("");
  const importRef = useRef(null);

  // Same-value edits (clicking the selected option) don't create undo steps.
  const update = useCallback(
    (path, value) =>
      set((current) => (Object.is(getIn(current, path), value) ? current : setIn(current, path, value)), path),
    [set],
  );
  const replace = useCallback((next) => set(next), [set]);

  // Unpublished edits are autosaved as a draft shortly after editing stops.
  // Once everything is published there is nothing to keep, so the draft is removed.
  useEffect(() => {
    if (!dirty) {
      clearDraft(session.user.id);
      setSaveState("saved");
      return undefined;
    }
    setSaveState("saving");
    const timer = setTimeout(
      () => setSaveState(saveDraft(session.user.id, config, published?.updatedAt ?? null) ? "saved" : "error"),
      250,
    );
    return () => clearTimeout(timer);
  }, [config, dirty, published, session.user.id]);

  useEffect(() => {
    saveUi(ui);
  }, [ui]);

  useEffect(() => {
    const onKey = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  useEffect(() => {
    if (!confirmReset) return undefined;
    const timer = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(""), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  const onImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      replace(await readConfigFile(file));
      setFlash(`Imported ${file.name}.`);
    } catch {
      setFlash("That file isn't a bio config (JSON).");
    }
  };

  const onReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    replace(starterFor(session.user));
    setFlash("Reset to a blank profile. Ctrl+Z brings yours back.");
  };

  // Sends the draft to the server. The server cleans it, so the editor then
  // switches to exactly what was saved.
  const onPublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const { profile } = await api.saveProfile(config.profile.username, config);
      const saved = normalizeConfig(profile.config);
      setPublished({ ...profile, config: saved });
      if (!sameConfig(saved, config)) replace(saved);
      setFlash(`Published at ${SITE_HOST}/${profile.username}`);
    } catch (error) {
      if (error.status === 401) {
        window.location.assign("/");
        return;
      }
      setFlash(describeError(error));
      if (error.code === "invalid_username" || error.code === "username_taken") {
        setUi((prev) => ({ ...prev, tab: "profile" }));
      }
    } finally {
      setPublishing(false);
    }
  };

  const onResizeStart = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  };
  const onResizeMove = (event) => {
    if (!resizing) return;
    setUi((prev) => ({ ...prev, panelWidth: clamp(event.clientX - RAIL_WIDTH, 340, 720) }));
  };
  const onResizeEnd = () => setResizing(false);

  const active = TABS.find((tab) => tab.id === ui.tab) ?? TABS[0];
  const { Panel } = active;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0b0b10] px-3">
        <div className="flex items-center gap-2 pl-1">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-[13px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #8b7bff, #5b8cff)" }}
          >
            b
          </span>
          <span className="text-sm font-semibold tracking-tight">{SITE_NAME}</span>
        </div>
        <div className="ml-3 flex items-center gap-0.5">
          <ToolbarButton title="Undo (Ctrl+Z)" onClick={undo} disabled={!history.canUndo}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!history.canRedo}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <SaveBadge state={saveState} dirty={dirty} />
        {flash && <span className="min-w-0 truncate text-xs text-white/60">{flash}</span>}
        <div className="ml-auto flex items-center gap-1.5">
          <TextButton onClick={() => importRef.current?.click()}>
            <FileUp className="h-3.5 w-3.5" /> Import
          </TextButton>
          <TextButton onClick={() => downloadConfig(config)}>
            <Download className="h-3.5 w-3.5" /> Export
          </TextButton>
          <TextButton onClick={onReset} danger={confirmReset}>
            <RotateCcw className="h-3.5 w-3.5" /> {confirmReset ? "Click again to reset" : "Reset"}
          </TextButton>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import a bio config file"
            onChange={onImport}
          />
          {published && (
            <a
              href={`/${published.username}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View page
            </a>
          )}
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing || !dirty}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
              dirty ? "bg-[#7c6cff] text-white hover:brightness-110" : "bg-white/[0.06] text-white/45"
            }`}
          >
            {publishing ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : dirty ? (
              <Upload className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {publishing ? "Publishing" : dirty ? (published ? "Publish changes" : "Publish") : "Published"}
          </button>
        </div>
      </header>

      <div
        className={`flex min-h-0 flex-1 ${resizing ? "select-none" : ""}`}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onPointerCancel={onResizeEnd}
      >
        <nav
          aria-label="Editor sections"
          className="flex shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] bg-[#0b0b10] py-3"
          style={{ width: RAIL_WIDTH }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = ui.tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setUi((prev) => ({ ...prev, tab: id }))}
                aria-current={selected ? "page" : undefined}
                className={`flex w-[60px] flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] font-medium transition ${
                  selected ? "bg-[#7c6cff]/15 text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${selected ? "text-[#a99dff]" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        <aside className="flex min-h-0 shrink-0 flex-col bg-[#0d0d12]" style={{ width: ui.panelWidth }}>
          <div className="border-b border-white/[0.06] px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">{active.label}</h2>
            <p className="mt-0.5 text-xs text-white/45">{active.blurb}</p>
          </div>
          <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <Panel
              config={config}
              update={update}
              replace={replace}
              editor={{
                session,
                published,
                sampleActivity: Boolean(ui.sampleActivity),
                setSampleActivity: (value) => setUi((prev) => ({ ...prev, sampleActivity: value })),
              }}
            />
          </div>
        </aside>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to resize the panel"
          onPointerDown={onResizeStart}
          className={`w-1.5 shrink-0 cursor-col-resize transition-colors hover:bg-[#7c6cff]/40 ${
            resizing ? "bg-[#7c6cff]/60" : "bg-[#0b0b10]"
          }`}
        />

        <PreviewPane
          config={config}
          device={ui.device}
          onDeviceChange={(device) => setUi((prev) => ({ ...prev, device }))}
          blockPointer={resizing}
          sampleActivity={ui.sampleActivity}
          publishedUsername={published?.username}
        />
      </div>
    </div>
  );
}
