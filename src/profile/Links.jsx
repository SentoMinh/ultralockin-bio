import { ArrowRight } from "lucide-react";
import { getPlatform, LINK_ICONS, PlatformIcon, platformColor } from "../shared/platforms.jsx";
import { hexToRgba, isDarkColor, isOpenableLink, prettyUrl, visibleColor } from "../shared/utils.js";

export function Socials({ socials, theme, onCopy }) {
  const darkPage = isDarkColor(theme.background.color);
  const shape = theme.roundSocials ? "9999px" : `${Math.min(theme.radius, 14)}px`;
  const border = theme.borderWidth
    ? `${theme.borderWidth}px solid ${hexToRgba(theme.borderColor, theme.borderOpacity)}`
    : "none";

  return (
    <ul className="flex flex-wrap justify-center gap-2.5">
      {socials.map((social) => {
        const platform = getPlatform(social.platform);
        const value = social.value.trim();
        const color = theme.brandColors
          ? visibleColor(platformColor(platform), darkPage, theme.text)
          : theme.iconColor;
        const content = (
          <>
            <PlatformIcon
              id={social.platform}
              className="h-[22px] w-[22px]"
              style={{ filter: theme.iconGlow ? `drop-shadow(0 0 5px ${hexToRgba(color, 0.7)})` : undefined }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 scale-90 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition duration-200 group-hover:scale-100 group-hover:opacity-100">
              {platform.label}
            </span>
          </>
        );
        const shared = {
          className:
            "group relative grid h-11 w-11 place-items-center transition duration-300 hover:-translate-y-0.5 hover:brightness-125",
          style: { borderRadius: shape, border, color },
        };
        return (
          <li key={social.id}>
            {isOpenableLink(value) ? (
              <a href={value} target="_blank" rel="noopener noreferrer" aria-label={platform.label} {...shared}>
                {content}
              </a>
            ) : (
              <button type="button" onClick={() => onCopy(value, platform.label)} aria-label={`Copy ${platform.label}`} {...shared}>
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function LinkCards({ links, theme, tile }) {
  const iconBox = {
    border: `1px solid ${hexToRgba(theme.borderColor, theme.borderOpacity * 0.7)}`,
    borderRadius: Math.max(theme.radius - 2, 6),
    color: theme.iconColor,
  };

  return (
    <ul className={`grid gap-3 ${links.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {links.map((link) => {
        const Icon = LINK_ICONS[link.icon] ?? LINK_ICONS.link;
        const url = link.url.trim();
        const opens = isOpenableLink(url);
        const inner = (
          <>
            <span className="grid h-10 w-10 shrink-0 place-items-center" style={iconBox}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold">{link.title || prettyUrl(url)}</span>
              {url && <span className="block truncate text-xs opacity-60">{prettyUrl(url)}</span>}
            </span>
            {opens && (
              <ArrowRight className="h-[18px] w-[18px] shrink-0 opacity-80 transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </>
        );
        return (
          <li key={link.id} className="sm:odd:last:col-span-2">
            {opens ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 transition duration-300 hover:brightness-125"
                style={tile}
              >
                {inner}
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3" style={tile}>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
