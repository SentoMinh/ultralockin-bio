// Local development at http://127.0.0.1:5190: rebuilds the app on every change
// and serves it together with the API, a local database and local file storage.
import { spawn, spawnSync } from "node:child_process";

const once = (command) =>
  spawnSync(command, { shell: true, stdio: "inherit", env: { ...process.env, CI: "true" } });

once("npx wrangler d1 migrations apply ultralockin-bio --local");
once("npx vite build"); // so dist/ exists before the server starts

const children = [
  spawn("npx vite build --watch", { shell: true, stdio: "inherit" }),
  spawn("npx wrangler pages dev dist --port 5190 --ip 127.0.0.1", { shell: true, stdio: "inherit" }),
];

const stop = () => {
  for (const child of children) {
    if (process.platform === "win32") spawnSync(`taskkill /F /T /PID ${child.pid}`, { shell: true });
    else child.kill("SIGTERM");
  }
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
