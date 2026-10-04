import { useEffect, useRef, useState } from "react";
import { FONTS } from "../shared/config.js";
import { prefersReducedMotion, splitGraphemes } from "../shared/utils.js";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// "once" types the text a single time; after that, edits show instantly so the
// preview doesn't retype on every keystroke. "loop" types, deletes, repeats.
export function useTypewriter(text, mode, speed) {
  const [shown, setShown] = useState(mode === "off" ? text : "");
  const played = useRef(false);
  const lastMode = useRef(mode);

  useEffect(() => {
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      played.current = false;
    }
    if (mode === "off" || prefersReducedMotion() || (mode === "once" && played.current)) {
      setShown(text);
      return undefined;
    }
    const chars = splitGraphemes(text);
    let index = 0;
    let deleting = false;
    let timer;
    const step = () => {
      if (!deleting) {
        index += 1;
        setShown(chars.slice(0, index).join(""));
        if (index >= chars.length) {
          if (mode === "once") {
            played.current = true;
            return;
          }
          deleting = true;
          timer = setTimeout(step, 1600);
          return;
        }
        timer = setTimeout(step, speed);
      } else {
        index -= 1;
        setShown(chars.slice(0, index).join(""));
        if (index <= 0) {
          deleting = false;
          timer = setTimeout(step, 450);
          return;
        }
        timer = setTimeout(step, Math.max(18, speed * 0.45));
      }
    };
    setShown("");
    timer = setTimeout(step, 400);
    return () => clearTimeout(timer);
  }, [text, mode, speed]);

  return shown;
}

// Scrolls the tab title like a marquee and reports each frame (for the editor's tab pill).
export function useAnimatedTitle(title, animated, onTitle) {
  const onTitleRef = useRef(onTitle);
  useEffect(() => {
    onTitleRef.current = onTitle;
  });

  useEffect(() => {
    const base = String(title ?? "").trim() || "Bio";
    const apply = (value) => {
      document.title = value;
      onTitleRef.current?.(value);
    };
    apply(base);
    if (!animated || prefersReducedMotion() || base.length < 3) return undefined;
    let chars = splitGraphemes(`${base} `);
    const timer = setInterval(() => {
      chars = [...chars.slice(1), chars[0]];
      apply(chars.join("").trim() || base);
    }, 380);
    return () => clearInterval(timer);
  }, [title, animated]);
}

export function useGoogleFont(name) {
  useEffect(() => {
    const font = FONTS.find((item) => item.name === name);
    if (!font) return;
    const id = `bio-font-${font.name.replace(/\W/g, "")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${font.css}&display=swap`;
    document.head.appendChild(link);
  }, [name]);
}

export function useNow(active, interval = 1000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [active, interval]);
  return now;
}
