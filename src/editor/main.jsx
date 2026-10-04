import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { api, SITE_NAME } from "../shared/api.js";
import EditorApp from "./EditorApp.jsx";

document.title = `Dashboard · ${SITE_NAME}`;

// The panel needs a login: without one, go back to the home page.
function Boot() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    api
      .me()
      .then((session) => setState({ status: "ready", session }))
      .catch((error) => {
        if (error.status === 401) window.location.replace("/");
        else setState({ status: "error" });
      });
  }, []);

  if (state.status === "ready") return <EditorApp session={state.session} />;
  return (
    <div className="grid h-full place-items-center text-sm text-white/50">
      {state.status === "error" ? "Couldn't reach the server. Reload to try again." : "Loading…"}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
);
