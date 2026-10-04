# ultralockin-bio

Self-hosted bio pages in the style of guns.lol and e-z.bio, running on Cloudflare's free tier.
One deployment hosts many people: each person logs in with Discord, designs a page in a live
editor, and publishes it at `yoursite/<username>`.

Live example: https://bio.ultralockin.tech/sentoming

## Features

- **Live editor** with a side-by-side preview, undo/redo, presets, and import/export
- **Effects**: 3D tilt, cursor effects (including the oneko cat), name effects, background effects,
  typewriter text, scrolling tab title, click-to-enter screen
- **Live Discord card**: status, games and Spotify through [Lanyard](https://github.com/Phineas/lanyard)
- **Links**: about 90 social platforms, link cards, badges
- **Background music**: one song from a YouTube or SoundCloud link or an uploaded file, played as audio only, starting at the second you pick
- **Real view counter**: one view per person per day, no IP addresses stored
- **Accounts**: Discord login, invite-only sign-up, one username per person
- **Uploads**: avatars, backgrounds, music and cursors stored in Cloudflare R2
- **Link previews** for Discord and other apps

Stack: Vite, React 19, Tailwind CSS 4, Cloudflare Pages Functions, D1 (database), R2 (files).

## Set up your own

You need Node.js 20+, a Cloudflare account, and a Discord account.

1. Install and log in:

   ```
   npm install
   npx wrangler login
   ```

2. Create your settings files:

   ```
   cp wrangler.example.toml wrangler.toml
   cp .dev.vars.example .dev.vars
   ```

3. Create the Cloudflare resources (pick your own name instead of `my-bio`):

   ```
   npx wrangler d1 create my-bio
   npx wrangler r2 bucket create my-bio-media
   npx wrangler pages project create my-bio --production-branch main
   ```

4. Fill in `wrangler.toml`: the project name, the database name and id printed in step 3, the
   bucket name, and your Discord user id in `ADMIN_DISCORD_IDS`. Then replace `ultralockin-bio`
   with your own name in the `scripts` of `package.json` and in `scripts/dev.mjs`.

5. Create the database tables:

   ```
   npm run db:migrate
   ```

6. Create a Discord application at https://discord.com/developers/applications. Under OAuth2, add
   the redirect `https://<your-domain>/api/auth/callback`. Put the Client ID in `wrangler.toml`,
   then store the Client Secret (it is never written to a file):

   ```
   npx wrangler pages secret put DISCORD_CLIENT_SECRET --project-name my-bio
   npx wrangler pages secret put VIEW_SALT --project-name my-bio
   ```

   `VIEW_SALT` is any long random text; it protects the view counter's visitor hashes.

7. Deploy:

   ```
   npm run deploy
   ```

   To use your own domain, open the Cloudflare dashboard, go to Workers & Pages, open your
   project, and add the domain under **Custom domains**. A DNS record alone is not enough.

8. Open the site and log in with Discord. Accounts listed in `ADMIN_DISCORD_IDS` need no invite
   and can create invite codes in the dashboard's Account tab.

## Local development

```
npm run dev
```

Open http://127.0.0.1:5190. This rebuilds on every change and runs the API with a local database
and local file storage. With `DEV_LOGIN=1` in `.dev.vars`, the home page shows a test login that
only works on your own computer.

## Make it yours

- **Site name**: create `.env.local` with `VITE_SITE_NAME=My Bio`.
- **Sign-up**: new accounts need an invite code. Admins create codes in the Account tab.
- **Upload limits**: see `UPLOAD_TYPES` and `USER_QUOTA_BYTES` in `server/handlers.js`.
- **Reserved usernames and profile rules**: `server/profiles.js`.

## Good to know

- A live Discord status only appears for people who have joined the Lanyard Discord server.
- City suggestions for the Location field come from [Open-Meteo](https://open-meteo.com/)'s
  geocoding API, which is free for non-commercial use.
- Every saved profile is rebuilt on the server from known fields only, and uploads are limited
  to images, audio, video and cursor files.

## Credits

- [oneko.js](https://github.com/adryd325/oneko.js) by adryd325 (MIT): the cat and its sprite
- [cursor-effects](https://github.com/tholman/cursor-effects) by Tim Holman (MIT)
- [react-parallax-tilt](https://github.com/mkosir/react-parallax-tilt), [dnd-kit](https://github.com/clauderic/dnd-kit),
  [react-colorful](https://github.com/omgovich/react-colorful), [react-hot-toast](https://github.com/timolins/react-hot-toast) (MIT)
- [Simple Icons](https://github.com/simple-icons/simple-icons) (CC0) and [Lucide](https://github.com/lucide-icons/lucide) (ISC)
- [Lanyard](https://github.com/Phineas/lanyard) for Discord presence
- City data from [GeoNames](https://www.geonames.org/) (CC BY 4.0) through Open-Meteo

## License

MIT. See [LICENSE](LICENSE).
