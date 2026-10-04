import { useEffect, useId, useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { Image as ImageIcon, LoaderCircle, Music, Plus, Upload, Video, X } from "lucide-react";
import { api, describeError } from "../shared/api.js";
import { useMediaUrl } from "../shared/media.js";

export const iconButton =
  "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] border border-white/[0.08] bg-[#0b0b10] text-white/55 transition hover:border-white/25 hover:text-white disabled:opacity-40";

export function Section({ title, description, action, children }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <header className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-white/90">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-white/45">{description}</p>}
        </div>
        {action}
      </header>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

export function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium text-white/60">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] leading-relaxed text-white/35">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, hint, value, onChange, ...rest }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input id={id} className="ed-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
    </Field>
  );
}

export function TextArea({ label, hint, value, onChange, rows = 3, ...rest }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className="ed-input resize-y"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </Field>
  );
}

// Free city search (Open-Meteo geocoding, GeoNames data). No key needed.
const CITY_SEARCH_URL = "https://geocoding-api.open-meteo.com/v1/search";

// Turns search results into "City, Country" options. When two results share
// that label (Springfield, United States), the region is added to tell them apart.
function cityOptions(allResults, query) {
  // The search also matches alternate names; keep places whose own name matches what was typed.
  const plain = (text) => String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const matching = allResults.filter((place) => plain(place.name).includes(plain(query)));
  const results = matching.length ? matching : allResults;
  const base = (place) => [place.name, place.country].filter(Boolean).join(", ");
  const counts = new Map();
  for (const place of results) counts.set(base(place), (counts.get(base(place)) ?? 0) + 1);
  const seen = new Set();
  const options = [];
  for (const place of results) {
    const duplicate = counts.get(base(place)) > 1 && place.admin1 && place.admin1 !== place.name;
    const label = duplicate ? [place.name, place.admin1, place.country].join(", ") : base(place);
    if (seen.has(label)) continue;
    seen.add(label);
    options.push({ label, detail: !duplicate && place.admin1 && place.admin1 !== place.name ? place.admin1 : "" });
  }
  return options;
}

// Text field that suggests "City, Country" while typing. Free text still works.
export function LocationInput({ label, hint, value, onChange }) {
  const id = useId();
  const listId = `${id}-options`;
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Only search after the user types, not when a saved value loads or is picked.
  const [searching, setSearching] = useState(false);
  const query = String(value ?? "").split(",")[0].trim();

  useEffect(() => {
    if (!searching || query.length < 2) {
      setOptions([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${CITY_SEARCH_URL}?name=${encodeURIComponent(query)}&count=7&language=en&format=json`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { results: [] }))
        .then((data) => {
          setOptions(cityOptions(data.results ?? [], query));
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searching]);

  const choose = (option) => {
    onChange(option.label);
    setSearching(false);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (!open || options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && options.length > 0;

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          className="ed-input"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value ?? ""}
          placeholder="Start typing a city…"
          maxLength={60}
          onChange={(event) => {
            setSearching(true);
            onChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#16161d] py-1 shadow-2xl"
          >
            {options.map((option, index) => (
              <li
                key={option.label}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                // mousedown (not click) so the choice lands before the input loses focus
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActive(index)}
                className={`flex cursor-pointer items-baseline gap-2 px-3 py-1.5 text-[13px] ${
                  index === active ? "bg-white/[0.08] text-white" : "text-white/80"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.detail && <span className="truncate text-[11px] text-white/40">{option.detail}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-[13px] text-white/85">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-relaxed text-white/40">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[#7c6cff]" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </button>
    </div>
  );
}

export function Slider({ label, hint, value, onChange, min = 0, max = 100, step = 1, format = (v) => v }) {
  const id = useId();
  return (
    <Field hint={hint}>
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-medium text-white/60">
          {label}
        </label>
        <span className="tabular-nums text-white/45">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        className="ed-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

export function Segmented({ label, hint, value, onChange, options }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-black/30 p-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
            className={`flex-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              value === option.id ? "bg-white/[0.12] text-white shadow-sm" : "text-white/50 hover:text-white/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function OptionGrid({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={`rounded-xl border px-2.5 py-2 text-left transition ${
                active ? "border-[#7c6cff] bg-[#7c6cff]/15" : "border-white/[0.07] bg-black/20 hover:border-white/20"
              }`}
            >
              <span className={`block text-xs font-semibold ${active ? "text-white" : "text-white/80"}`}>
                {option.label}
              </span>
              {option.note && <span className="mt-0.5 block text-[10.5px] leading-snug text-white/40">{option.note}</span>}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function ColorInput({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {label && <div className="mb-1.5 text-xs font-medium text-white/60">{label}</div>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-[9px] border border-white/[0.08] bg-[#0b0b10] px-2 py-1.5 text-left transition hover:border-white/20"
      >
        <span className="h-5 w-5 shrink-0 rounded-md ring-1 ring-white/20" style={{ background: value }} />
        <span className="font-mono text-xs uppercase text-white/75">{value}</span>
      </button>
      {open && (
        <div className="absolute inset-x-0 z-30 mt-2 min-w-[190px] rounded-xl border border-white/10 bg-[#16161d] p-3 shadow-2xl">
          <HexColorPicker color={value} onChange={onChange} />
          <HexColorInput color={value} onChange={onChange} prefixed className="ed-input mt-2 font-mono uppercase" />
        </div>
      )}
    </div>
  );
}

// A URL field plus an upload button. Uploads go to the server (your account's storage).
export function MediaInput({ label, hint, value, onChange, accept = "image/*", kind = "image" }) {
  const inputId = useId();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const url = useMediaUrl(value);
  const KindIcon = kind === "audio" ? Music : kind === "video" ? Video : ImageIcon;

  const onPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange((await api.upload(file)).url);
    } catch (uploadError) {
      setError(describeError(uploadError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint} htmlFor={inputId}>
      <div className="flex items-center gap-2">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-white/[0.04] text-white/35 ring-1 ring-white/[0.06]">
          {kind === "image" && url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <KindIcon className="h-4 w-4" />
          )}
        </span>
        <input
          id={inputId}
          className="ed-input"
          value={value ?? ""}
          placeholder="Paste an https link or upload"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className={iconButton}
          onClick={() => fileRef.current?.click()}
          title="Upload from this computer"
          aria-label="Upload file"
          disabled={busy}
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </button>
        {value ? (
          <button type="button" className={iconButton} onClick={() => onChange("")} title="Clear" aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          aria-label={`Upload ${label ?? "file"}`}
          onChange={onPick}
        />
      </div>
      {error && <p className="text-[11px] text-rose-300">{error}</p>}
    </Field>
  );
}

const NOTICE_TONES = {
  info: "border-sky-400/20 bg-sky-400/[0.07] text-sky-100/80",
  warn: "border-amber-400/25 bg-amber-400/[0.07] text-amber-100/85",
  ok: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-100/85",
  muted: "border-white/[0.07] bg-white/[0.03] text-white/55",
};

export function Notice({ tone = "info", action, children }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${NOTICE_TONES[tone]}`}>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function Empty({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-white/40">
      {children}
    </p>
  );
}

export function AddButton({ onClick, label = "Add" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/75 transition hover:border-white/25 hover:text-white"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
