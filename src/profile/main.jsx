import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { normalizeConfig } from "../shared/config.js";
import { MSG } from "../shared/storage.js";
import ProfilePage from "./ProfilePage.jsx";

const embedded = window.parent !== window;

// On the live site the server writes the profile into the page (see functions/[username].js).
function readInlineProfile() {
  try {
    const data = JSON.parse(document.getElementById("bio-data").textContent);
    return { status: "ready", username: data.username, config: normalizeConfig(data.config) };
  } catch {
    return null;
  }
}

function ProfileRoot() {
  const [state, setState] = useState(() => (embedded ? null : readInlineProfile()) ?? { status: "loading" });
  const [options, setOptions] = useState({});

  useEffect(() => {
    if (embedded) {
      // Inside the editor: every edit arrives by postMessage, instantly.
      const onMessage = (event) => {
        if (event.origin !== window.location.origin || event.source !== window.parent) return;
        if (event.data?.type === MSG.config && event.data.config) {
          setState({ status: "ready", username: "", config: normalizeConfig(event.data.config) });
          setOptions(event.data.options ?? {});
        }
      };
      window.addEventListener("message", onMessage);
      window.parent.postMessage({ type: MSG.ready }, window.location.origin);
      return () => window.removeEventListener("message", onMessage);
    }
    if (state.status === "ready") return undefined;

    // No profile in the page: load it by the name in the address.
    let alive = true;
    const name = decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[0] ?? "");
    fetch(`/api/profiles/${encodeURIComponent(name)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("missing"))))
      .then((data) => {
        if (alive) setState({ status: "ready", username: data.username, config: normalizeConfig(data.config) });
      })
      .catch(() => {
        if (alive) setState({ status: "missing" });
      });
    return () => {
      alive = false;
    };
    // Runs once: the page is either embedded or standalone for its whole life.
  }, []);

  if (state.status === "missing") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#09090d] text-sm text-white/60">
        This bio doesn&apos;t exist.
      </div>
    );
  }
  if (state.status !== "ready") return null;
  return <ProfilePage config={state.config} username={state.username} embedded={embedded} options={options} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ProfileRoot />
  </StrictMode>,
);
