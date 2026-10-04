import { useEffect, useState } from "react";

const REST_URL = "https://api.lanyard.rest/v1/users/";
const SOCKET_URL = "wss://api.lanyard.rest/socket";

export const isDiscordId = (value) => /^\d{17,20}$/.test(String(value ?? "").trim());

// Live Discord presence through Lanyard (github.com/Phineas/lanyard).
// status: "idle" (no id) | "loading" | "live" | "not-monitored" | "error"
export function useLanyard(userId) {
  const id = isDiscordId(userId) ? String(userId).trim() : "";
  const [state, setState] = useState({ id: "", status: "idle", data: null });

  useEffect(() => {
    if (!id) return undefined;
    let closed = false;
    let socket;
    let heartbeat;
    let retryTimer;

    const connect = () => {
      socket = new WebSocket(SOCKET_URL);
      socket.addEventListener("message", (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message.op === 1) {
          clearInterval(heartbeat);
          heartbeat = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
          }, message.d?.heartbeat_interval ?? 30000);
          socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: id } }));
        } else if (
          message.op === 0 &&
          (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE") &&
          message.d
        ) {
          setState((prev) => ({
            id,
            status: "live",
            data: { ...(prev.id === id ? prev.data : null), ...message.d },
          }));
        }
      });
      socket.addEventListener("close", () => {
        clearInterval(heartbeat);
        if (!closed) retryTimer = setTimeout(connect, 5000);
      });
    };

    // REST first: it says whether Lanyard tracks this account at all.
    const check = () => {
      fetch(REST_URL + id)
        .then((response) => response.json())
        .then((json) => {
          if (closed) return;
          if (json.success) {
            setState({ id, status: "live", data: json.data });
            connect();
          } else {
            const notMonitored = json.error?.code === "user_not_monitored";
            setState({ id, status: notMonitored ? "not-monitored" : "error", data: null });
            retryTimer = setTimeout(check, 30000);
          }
        })
        .catch(() => {
          if (closed) return;
          setState({ id, status: "error", data: null });
          retryTimer = setTimeout(check, 30000);
        });
    };

    check();
    return () => {
      closed = true;
      clearInterval(heartbeat);
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [id]);

  if (!id) return { id, status: "idle", data: null };
  return state.id === id ? state : { id, status: "loading", data: null };
}

export function discordAvatarUrl(user, size = 256) {
  if (!user?.id) return "";
  if (!user.avatar) {
    const index =
      user.discriminator && user.discriminator !== "0"
        ? Number(user.discriminator) % 5
        : Number((BigInt(user.id) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
}

export function decorationUrl(user) {
  const asset = user?.avatar_decoration_data?.asset;
  return asset
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=240&passthrough=true`
    : "";
}

// `which` is "large" or "small" (the little badge on a game's picture).
export function activityImageUrl(activity, which = "large") {
  const image = activity?.assets?.[`${which}_image`];
  if (!image) return "";
  if (/^(https?:|data:)/.test(image)) return image;
  if (image.startsWith("mp:external/")) {
    return `https://media.discordapp.net/external/${image.slice("mp:external/".length)}`;
  }
  if (image.startsWith("spotify:")) return `https://i.scdn.co/image/${image.slice("spotify:".length)}`;
  return activity.application_id
    ? `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png`
    : "";
}

// Server tag shown next to a name (Discord's "primary guild").
export function serverTag(user) {
  const guild = user?.primary_guild;
  if (!guild?.tag || guild.identity_enabled === false) return null;
  return {
    tag: guild.tag,
    badge:
      guild.badge && guild.identity_guild_id
        ? `https://cdn.discordapp.com/guild-tag-badges/${guild.identity_guild_id}/${guild.badge}.png?size=32`
        : "",
  };
}

const svgImage = (body) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`)}`;

const SAMPLE_ALBUM = svgImage(
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1ed760"/><stop offset="1" stop-color="#0b3d2a"/></linearGradient></defs><rect width="64" height="64" rx="8" fill="url(#g)"/><circle cx="32" cy="32" r="14" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3"/><circle cx="32" cy="32" r="3" fill="#fff"/>',
);

const SAMPLE_GAME = svgImage(
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient></defs><rect width="64" height="64" rx="8" fill="url(#g)"/><rect x="14" y="24" width="36" height="18" rx="9" fill="#fff" fill-opacity=".92"/><circle cx="23" cy="33" r="3" fill="#4c1d95"/><circle cx="41" cy="31" r="2.2" fill="#4c1d95"/><circle cx="45" cy="35" r="2.2" fill="#4c1d95"/>',
);

// Fake presence for styling the card in the editor preview (never on the real page).
export function samplePresence({ userId, name }) {
  const now = Date.now();
  return {
    id: "sample",
    status: "live",
    data: {
      discord_user: {
        id: isDiscordId(userId) ? String(userId).trim() : "0",
        username: name || "you",
        global_name: name || "You",
        avatar: null,
      },
      discord_status: "online",
      active_on_discord_desktop: true,
      active_on_discord_mobile: true,
      activities: [
        { type: 4, name: "Custom Status", state: "vibing", emoji: { name: "🎧" } },
        { type: 2, name: "Spotify", id: "spotify:1" },
        {
          type: 0,
          name: "Minecraft",
          details: "Survival · Day 42",
          state: "Building a base",
          timestamps: { start: now - 25 * 60 * 1000 },
          assets: { large_image: SAMPLE_GAME, large_text: "Minecraft" },
        },
      ],
      listening_to_spotify: true,
      spotify: {
        song: "Sample song",
        artist: "Sample artist",
        album: "Sample album",
        album_art_url: SAMPLE_ALBUM,
        track_id: "",
        timestamps: { start: now - 62 * 1000, end: now + 138 * 1000 },
      },
    },
  };
}
