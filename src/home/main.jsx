import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { siDiscord } from "simple-icons";
import "../index.css";
import { api, SITE_HOST, SITE_NAME } from "../shared/api.js";

document.title = SITE_NAME;

const ERRORS = {
  invite_required: "New accounts need an invite code. Enter yours below, then log in.",
  invite_invalid: "That invite code isn't valid, or it was already used.",
  banned: "This account has been disabled.",
  login_failed: "Discord login didn't finish. Please try again.",
  discord_not_configured: "Discord login isn't set up on the server yet.",
};

function Home() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const [invite, setInvite] = useState((params.get("invite") ?? "").toUpperCase());
  const [session, setSession] = useState({ status: "loading" });
  const [dev, setDev] = useState({ id: "", name: "" });

  useEffect(() => {
    api
      .me()
      .then((me) => setSession({ status: "in", me }))
      .catch((err) => setSession({ status: "out", devLogin: Boolean(err.data?.devLogin) }));
  }, []);

  const inviteQuery = invite.trim() ? `invite=${encodeURIComponent(invite.trim())}` : "";
  const loginHref = `/api/auth/login${inviteQuery ? `?${inviteQuery}` : ""}`;
  const devHref = `/api/auth/dev-login?id=${encodeURIComponent(dev.id)}&name=${encodeURIComponent(dev.name)}${inviteQuery ? `&${inviteQuery}` : ""}`;
  const primary =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:brightness-110";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5 py-12 text-[#e8e8ef]"
      style={{
        background: "radial-gradient(1200px 600px at 50% -10%, #1b1840 0%, #09090d 60%)",
        fontFamily: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <main className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-base font-black text-white"
            style={{ background: "linear-gradient(135deg, #8b7bff, #5b8cff)" }}
          >
            b
          </span>
          <span className="text-lg font-semibold tracking-tight">{SITE_NAME}</span>
        </div>

        <h1 className="text-center text-3xl font-bold tracking-tight">One link for everything you are.</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-white/55">
          Your own page at {SITE_HOST}/you: links, live Discord status, music and effects. Invite-only for now.
        </p>

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          {error && ERRORS[error] && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-amber-100/90"
            >
              {ERRORS[error]}
            </p>
          )}

          {session.status === "loading" && <p className="py-6 text-center text-sm text-white/45">Loading…</p>}

          {session.status === "in" && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-white/70">
                Signed in as <b className="text-white">{session.me.user.name}</b>
              </p>
              <a href="/dashboard" className={`${primary} w-full bg-[#7c6cff]`}>
                Open your dashboard
              </a>
              {session.me.profile && (
                <a
                  href={`/${session.me.profile.username}`}
                  className="block text-sm text-white/55 underline-offset-4 hover:text-white hover:underline"
                >
                  View {SITE_HOST}/{session.me.profile.username}
                </a>
              )}
            </div>
          )}

          {session.status === "out" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="invite" className="block text-xs font-medium text-white/60">
                  Invite code (only needed for a new account)
                </label>
                <input
                  id="invite"
                  className="ed-input font-mono uppercase tracking-widest"
                  value={invite}
                  onChange={(event) => setInvite(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="XXXXXXXXXX"
                  maxLength={20}
                  autoComplete="off"
                />
              </div>
              <a href={loginHref} className={`${primary} w-full bg-[#5865f2]`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d={siDiscord.path} />
                </svg>
                Log in with Discord
              </a>
              <p className="text-center text-xs text-white/40">Already have a page? Just log in, no code needed.</p>

              {session.devLogin && (
                <div className="mt-4 space-y-2 rounded-xl border border-dashed border-white/15 p-3">
                  <p className="text-xs font-semibold text-white/60">Test login (this computer only)</p>
                  <input
                    className="ed-input"
                    placeholder="Discord ID (numbers)"
                    value={dev.id}
                    onChange={(event) => setDev({ ...dev, id: event.target.value.replace(/\D/g, "") })}
                    aria-label="Test Discord ID"
                  />
                  <input
                    className="ed-input"
                    placeholder="Name"
                    value={dev.name}
                    onChange={(event) => setDev({ ...dev, name: event.target.value })}
                    aria-label="Test name"
                  />
                  <a
                    href={devHref}
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-white/15 text-xs font-semibold text-white/80 hover:border-white/30"
                  >
                    Test login
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
