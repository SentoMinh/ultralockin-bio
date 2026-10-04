import { useEffect, useRef } from "react";
import { useMediaUrl } from "../shared/media.js";
import { hexToRgba, prefersReducedMotion } from "../shared/utils.js";

export function Background({ background }) {
  const url = useMediaUrl(background.url);
  const blur = Number(background.blur) || 0;
  let layer = null;
  if (background.type === "gradient") {
    layer = (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${background.angle}deg, ${background.color}, ${background.color2})`,
        }}
      />
    );
  } else if (background.type === "image" && url) {
    layer = <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  } else if (background.type === "video" && url) {
    layer = (
      <video
        key={url}
        src={url}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ backgroundColor: background.color }}
    >
      {layer && (
        // Oversized by the blur radius so blurred edges don't show the page color.
        <div
          className="absolute"
          style={{ inset: -blur * 2, filter: `blur(${blur}px) brightness(${background.brightness}%)` }}
        >
          {layer}
        </div>
      )}
    </div>
  );
}

const GLYPHS = "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF<>/*+=";

export function BackgroundFx({ mode, theme }) {
  const canvasRef = useRef(null);
  const { accent, text } = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode === "none" || prefersReducedMotion()) return undefined;
    const ctx = canvas.getContext("2d");
    const rand = (min, max) => min + Math.random() * (max - min);
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let items = [];

    const spawn = () => {
      const area = (width * height) / (1280 * 800);
      const count = (base, min) => Math.round(base * area) + min;
      if (mode === "snow") {
        items = Array.from({ length: count(140, 20) }, () => ({
          x: rand(0, width), y: rand(0, height), r: rand(0.8, 2.8), vy: rand(0.35, 1.2), drift: rand(0, 6.3),
        }));
      } else if (mode === "rain") {
        items = Array.from({ length: count(170, 20) }, () => ({
          x: rand(0, width), y: rand(0, height), len: rand(10, 24), vy: rand(9, 16),
        }));
      } else if (mode === "stars") {
        items = Array.from({ length: count(180, 30) }, () => ({
          x: rand(0, width), y: rand(0, height), r: rand(0.3, 1.5), speed: rand(0.6, 2.2), phase: rand(0, 6.3),
        }));
      } else if (mode === "fireflies") {
        items = Array.from({ length: count(40, 12) }, () => ({
          x: rand(0, width), y: rand(0, height), r: rand(1.2, 2.6), angle: rand(0, 6.3), speed: rand(0.15, 0.55), phase: rand(0, 6.3),
        }));
      } else if (mode === "matrix") {
        const size = 16;
        items = Array.from({ length: Math.ceil(width / size) }, (_, i) => ({
          x: i * size, y: rand(-height, 0), speed: rand(2, 5), size,
        }));
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    };

    const draw = (time) => {
      frame = requestAnimationFrame(draw);
      if (mode === "matrix" && time - last < 50) return; // ~20 fps is plenty for falling code
      last = time;
      ctx.clearRect(0, 0, width, height);

      if (mode === "snow") {
        ctx.fillStyle = hexToRgba(text, 0.8);
        for (const p of items) {
          p.y += p.vy;
          p.drift += 0.01;
          p.x += Math.sin(p.drift) * 0.35;
          if (p.y > height + 4) {
            p.y = -4;
            p.x = rand(0, width);
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "rain") {
        ctx.strokeStyle = hexToRgba(accent, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const p of items) {
          p.y += p.vy;
          if (p.y > height) {
            p.y = -p.len;
            p.x = rand(0, width);
          }
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1.5, p.y + p.len);
        }
        ctx.stroke();
      } else if (mode === "stars") {
        for (const p of items) {
          ctx.fillStyle = hexToRgba(text, 0.25 + 0.75 * Math.abs(Math.sin((time / 1000) * p.speed + p.phase)));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === "fireflies") {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 12;
        for (const p of items) {
          p.angle += rand(-0.2, 0.2);
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
          ctx.fillStyle = hexToRgba(accent, 0.35 + 0.65 * Math.abs(Math.sin(time / 900 + p.phase)));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (mode === "matrix") {
        ctx.font = "15px ui-monospace, SFMono-Regular, Consolas, monospace";
        for (const col of items) {
          col.y += col.speed * 4;
          if (col.y - 18 * col.size > height) col.y = rand(-200, 0);
          for (let i = 0; i < 18; i += 1) {
            const y = col.y - i * col.size;
            if (y < -col.size || y > height + col.size) continue;
            // Glyph is tied to the grid cell, so it only changes when the trail moves a row.
            const cell = Math.floor(y / col.size) * 7 + col.x;
            ctx.fillStyle = i === 0 ? hexToRgba(text, 0.9) : hexToRgba(accent, (1 - i / 18) * 0.55);
            ctx.fillText(GLYPHS[Math.abs(cell) % GLYPHS.length], col.x, y);
          }
        }
      }
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [mode, accent, text]);

  if (mode === "none") return null;
  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0" />;
}
