import { isReservedPath, normalizeUsername } from "../server/profiles.js";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function notFoundPage(name) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Not found</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #09090d; color: #e8e8ef; font-family: system-ui, "Segoe UI", sans-serif; text-align: center; }
      h1 { font-size: 22px; margin: 0 0 8px; }
      p { margin: 0 0 20px; color: #9a9aa8; }
      a { color: #a99dff; }
    </style>
  </head>
  <body>
    <main>
      <h1>No bio at /${escapeHtml(name)}</h1>
      <p>This page doesn&#39;t exist yet.</p>
      <a href="/">Make your own bio</a>
    </main>
  </body>
</html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}

// GET /<username>: the public bio page. The saved profile is written into the
// page (so it renders without a second request) together with link-preview tags.
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const segment = String(params.username ?? "");
  // App pages (/dashboard, /profile) and files (/oneko.gif) are served by the built site.
  if (segment.includes(".") || isReservedPath(segment)) return context.next();

  const username = normalizeUsername(segment);
  const row =
    username && env.DB
      ? await env.DB.prepare("SELECT username, config FROM profiles WHERE username = ?").bind(username).first()
      : null;
  if (!row) return notFoundPage(segment);

  const config = JSON.parse(row.config);
  const origin = new URL(request.url).origin;
  const name = config.profile.displayName || row.username;
  const title = config.profile.pageTitle || name;
  const description = config.profile.description || `${name}'s bio`;
  const image = config.profile.avatarUrl ? new URL(config.profile.avatarUrl, origin).href : "";

  const tags = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${escapeHtml(name)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(`${origin}/${row.username}`)}" />`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    `<meta name="theme-color" content="${escapeHtml(config.theme.accent)}" />`,
    // "<" is escaped so profile text can never close this script tag.
    `<script id="bio-data" type="application/json">${JSON.stringify({ username: row.username, config }).replace(/</g, "\\u003c")}</script>`,
  ].join("");

  const page = await env.ASSETS.fetch(new URL("/profile", request.url));
  const rewritten = new HTMLRewriter()
    .on("title", {
      element(element) {
        element.setInnerContent(title);
      },
    })
    .on("head", {
      element(element) {
        element.append(tags, { html: true });
      },
    })
    .transform(page);

  return new Response(rewritten.body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
  });
}
