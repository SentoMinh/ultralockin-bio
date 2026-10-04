import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

const here = (file) => fileURLToPath(new URL(file, import.meta.url));

// The bio app (bio.ultralockin.tech). Three pages: home/login, the dashboard
// (editor) and the public profile. The API lives in functions/ and runs through
// wrangler, so use `npm run dev` rather than the plain Vite dev server.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        home: here("./index.html"),
        dashboard: here("./dashboard.html"),
        profile: here("./profile.html"),
      },
    },
  },
});
