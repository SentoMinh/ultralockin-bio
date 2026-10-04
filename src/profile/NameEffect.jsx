import { useEffect, useState } from "react";
import { hexToRgba } from "../shared/utils.js";
import { usePrefersReducedMotion } from "./hooks.js";

const STAR_PATH = "M34 0C36 22 46 32 68 34C46 36 36 46 34 68C32 46 22 36 0 34C22 32 32 22 34 0Z";

function SparkleText({ color, children }) {
  const reduced = usePrefersReducedMotion();
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (reduced) return undefined;
    const timer = setInterval(() => {
      const now = Date.now();
      setSparkles((list) => [
        ...list.filter((sparkle) => now - sparkle.born < 900),
        {
          id: `${now}-${Math.random()}`,
          born: now,
          size: 7 + Math.random() * 9,
          top: Math.random() * 100,
          left: Math.random() * 100,
        },
      ]);
    }, 240);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <span className="relative inline-block">
      {!reduced &&
        sparkles.map((sparkle) => (
          <svg
            key={sparkle.id}
            viewBox="0 0 68 68"
            aria-hidden="true"
            className="pointer-events-none absolute z-20"
            style={{
              top: `${sparkle.top}%`,
              left: `${sparkle.left}%`,
              width: sparkle.size,
              height: sparkle.size,
              marginTop: -sparkle.size / 2,
              marginLeft: -sparkle.size / 2,
              color,
              animation: "sparkle-life 0.9s linear forwards",
              filter: `drop-shadow(0 0 3px ${hexToRgba(color, 0.8)})`,
            }}
          >
            <path d={STAR_PATH} fill="currentColor" />
          </svg>
        ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
}

export default function NameEffect({ text, effect, theme, sparkleColor }) {
  switch (effect) {
    case "sparkle":
      return <SparkleText color={sparkleColor}>{text}</SparkleText>;
    case "glow":
      return (
        <span
          style={{
            textShadow: `0 0 10px ${hexToRgba(theme.accent, 0.9)}, 0 0 26px ${hexToRgba(theme.accent, 0.55)}`,
          }}
        >
          {text}
        </span>
      );
    case "rainbow":
      return <span className="fx-rainbow">{text}</span>;
    case "shine":
      return (
        <span className="fx-shine" style={{ "--fx-base": theme.text }}>
          {text}
        </span>
      );
    case "glitch":
      return (
        <span className="fx-glitch" data-text={text}>
          {text}
        </span>
      );
    default:
      return <span>{text}</span>;
  }
}
