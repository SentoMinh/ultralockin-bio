import { useEffect } from "react";
import {
  bubbleCursor,
  emojiCursor,
  fairyDustCursor,
  followingDotCursor,
  ghostCursor,
  rainbowCursor,
  snowflakeCursor,
  trailingCursor,
} from "cursor-effects";
import { useMediaUrl } from "../shared/media.js";
import { prefersReducedMotion, splitGraphemes } from "../shared/utils.js";

// oneko, the cat that chases the cursor. Adapted from adryd325/oneko.js (MIT);
// unlike the original it ignores the pointer, so it never blocks a click.
const SPRITES = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratch: [[-5, 0], [-6, 0], [-7, 0]],
  tired: [[-3, -2]],
  sleeping: [[-2, 0], [-2, -1]],
  N: [[-1, -2], [-1, -3]],
  NE: [[0, -2], [0, -3]],
  E: [[-3, 0], [-3, -1]],
  SE: [[-5, -1], [-5, -2]],
  S: [[-6, -3], [-7, -2]],
  SW: [[-5, -3], [-6, -1]],
  W: [[-4, -2], [-4, -3]],
  NW: [[-1, 0], [-1, -1]],
};

function createOneko(sprite = "/oneko.gif", speed = 10) {
  if (prefersReducedMotion()) return null;
  const cat = document.createElement("div");
  cat.setAttribute("aria-hidden", "true");
  Object.assign(cat.style, {
    position: "fixed",
    left: "16px",
    top: "16px",
    width: "32px",
    height: "32px",
    zIndex: "2147483646",
    pointerEvents: "none",
    imageRendering: "pixelated",
    backgroundImage: `url("${sprite}")`,
  });
  document.body.appendChild(cat);

  let x = 32;
  let y = 32;
  let mouseX = 0;
  let mouseY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleFrame = 0;

  const onMove = (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  };
  const setSprite = (name, frame) => {
    const [sx, sy] = SPRITES[name][frame % SPRITES[name].length];
    cat.style.backgroundPosition = `${sx * 32}px ${sy * 32}px`;
  };
  const resetIdle = () => {
    idleAnimation = null;
    idleFrame = 0;
  };
  const idle = () => {
    idleTime += 1;
    // Roughly every 20 seconds of stillness: nap or scratch.
    if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && idleAnimation === null) {
      idleAnimation = Math.random() < 0.5 ? "sleeping" : "scratch";
    }
    if (idleAnimation === "sleeping") {
      if (idleFrame < 8) setSprite("tired", 0);
      else setSprite("sleeping", Math.floor(idleFrame / 4));
      if (idleFrame > 192) resetIdle();
    } else if (idleAnimation === "scratch") {
      setSprite("scratch", idleFrame);
      if (idleFrame > 9) resetIdle();
    } else {
      setSprite("idle", 0);
      return;
    }
    idleFrame += 1;
  };
  const tick = () => {
    frameCount += 1;
    const dx = x - mouseX;
    const dy = y - mouseY;
    const distance = Math.hypot(dx, dy);
    if (distance < speed || distance < 48) {
      idle();
      return;
    }
    resetIdle();
    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7) - 1;
      return;
    }
    let direction = dy / distance > 0.5 ? "N" : "";
    direction += dy / distance < -0.5 ? "S" : "";
    direction += dx / distance > 0.5 ? "W" : "";
    direction += dx / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);
    x -= (dx / distance) * speed;
    y -= (dy / distance) * speed;
    x = Math.min(Math.max(16, x), window.innerWidth - 16);
    y = Math.min(Math.max(16, y), window.innerHeight - 16);
    cat.style.left = `${x - 16}px`;
    cat.style.top = `${y - 16}px`;
  };

  document.addEventListener("mousemove", onMove);
  setSprite("idle", 0);
  const timer = setInterval(tick, 100);
  return {
    destroy() {
      clearInterval(timer);
      document.removeEventListener("mousemove", onMove);
      cat.remove();
    },
  };
}

function createEffect(kind, { accent, text, emoji }) {
  switch (kind) {
    case "cat":
      return createOneko();
    case "sparkle":
      return fairyDustCursor({ colors: [accent, text, "#ffffff"] });
    case "trailing":
      return trailingCursor({ particles: 15, rate: 0.8 });
    case "ghost":
      return ghostCursor();
    case "dot":
      return followingDotCursor({ color: accent });
    case "rainbow":
      return rainbowCursor({ length: 24, size: 3 });
    case "bubble":
      return bubbleCursor();
    case "snowflake":
      return snowflakeCursor();
    case "emoji":
      return emojiCursor({ emoji: emoji.length ? emoji : ["✨"] });
    default:
      return null;
  }
}

export function useCursorFx(effects, theme) {
  const { cursor, cursorEmoji, cursorImage } = effects;
  const imageUrl = useMediaUrl(cursorImage);
  const emojiKey = splitGraphemes(cursorEmoji)
    .filter((part) => part.trim())
    .join("");

  useEffect(() => {
    if (!cursor || cursor === "none") return undefined;
    let instance = null;
    try {
      instance = createEffect(cursor, {
        accent: theme.accent,
        text: theme.text,
        emoji: splitGraphemes(emojiKey),
      });
    } catch (error) {
      console.warn("[bio] cursor effect failed", error);
    }
    return () => instance?.destroy?.();
  }, [cursor, theme.accent, theme.text, emojiKey]);

  useEffect(() => {
    document.documentElement.style.cursor = imageUrl ? `url("${imageUrl}") 0 0, auto` : "";
    return () => {
      document.documentElement.style.cursor = "";
    };
  }, [imageUrl]);
}
