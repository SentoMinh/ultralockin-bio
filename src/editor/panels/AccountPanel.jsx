import { useEffect, useState } from "react";
import { Check, Copy, LogOut } from "lucide-react";
import { api, SITE_HOST } from "../../shared/api.js";
import { copyText } from "../../shared/utils.js";
import { AddButton, Empty, iconButton, Notice, Section } from "../controls.jsx";

function Invites() {
  const [invites, setInvites] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    api
      .invites()
      .then((data) => setInvites(data.invites))
      .catch(() => setError("Couldn't load invites."));
  }, []);

  const create = async (count) => {
    setError("");
    try {
      setInvites((await api.createInvites(count)).invites);
    } catch {
      setError("Couldn't create invites.");
    }
  };

  const copyLink = async (code) => {
    if (await copyText(`${window.location.origin}/?invite=${code}`)) setCopied(code);
  };

  return (
    <Section
      title="Invites"
      description="Each code lets one new person create an account. Send them the link."
      action={<AddButton onClick={() => create(1)} label="New code" />}
    >
      {error && <Notice tone="warn">{error}</Notice>}
      {invites === null && !error && <p className="text-xs text-white/40">Loading…</p>}
      {invites?.length === 0 && <Empty>No invite codes yet.</Empty>}
      {invites?.length > 0 && (
        <ul className="space-y-1.5">
          {invites.map((invite) => (
            <li
              key={invite.code}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 py-1.5 pr-1.5 pl-3"
            >
              <span className={`font-mono text-xs tracking-wider ${invite.usedAt ? "text-white/35 line-through" : "text-white/85"}`}>
                {invite.code}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-white/40">
                {invite.usedAt
                  ? `used by ${invite.usedBy ?? "someone"}${invite.profile ? ` · /${invite.profile}` : ""}`
                  : "not used yet"}
              </span>
              {!invite.usedAt && (
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => copyLink(invite.code)}
                  title="Copy invite link"
                  aria-label={`Copy invite link for ${invite.code}`}
                >
                  {copied === invite.code ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => create(5)}
        className="text-xs font-medium text-white/55 underline-offset-4 hover:text-white hover:underline"
      >
        Create 5 at once
      </button>
    </Section>
  );
}

export default function AccountPanel({ editor }) {
  const { session, published } = editor;
  const { user } = session;

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      window.location.assign("/");
    }
  };

  return (
    <>
      <Section title="Your account">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-sm font-bold">
              {(user.name || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white/90">{user.name}</p>
            <p className="truncate text-xs text-white/45">Discord: @{user.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
        {published ? (
          <Notice tone="ok">
            Your page is live at{" "}
            <a href={`/${published.username}`} target="_blank" rel="noopener" className="font-semibold underline">
              {SITE_HOST}/{published.username}
            </a>
            .
          </Notice>
        ) : (
          <Notice tone="muted">
            Not published yet. Pick a username in the Profile tab, then press Publish at the top.
          </Notice>
        )}
      </Section>
      {session.isAdmin && <Invites />}
    </>
  );
}
