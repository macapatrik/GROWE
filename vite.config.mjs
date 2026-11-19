import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { localizePage } from "./scripts/localize-page.mjs";
import { localizeServiceLinks, servicePages } from "./scripts/service-pages.mjs";

const czechEntry = fileURLToPath(new URL("./index.html", import.meta.url));
const englishEntry = fileURLToPath(new URL("./en/index.html", import.meta.url));
const pageFile = fileURLToPath(new URL("./src/page.html", import.meta.url));
const englishCopy = fileURLToPath(new URL("./src/content.en.json", import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: { input: [czechEntry, englishEntry] },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), servicePages(), {
    name: "growe-static-content",
    transformIndexHtml(html, { filename }) {
      const english = filename === englishEntry;
      let page = readFileSync(pageFile, "utf8");
      if (english) {
        page = localizePage(page, JSON.parse(readFileSync(englishCopy, "utf8")));
        page = localizeServiceLinks(page);
      }
      const languageLink = english
        ? '<a class="language-switch" href="/" lang="cs" hreflang="cs" aria-label="Čeština">CZ</a>'
        : '<a class="language-switch" href="/en/" lang="en" hreflang="en" aria-label="English">EN</a>';
      page = page.replace('<!-- language switch -->', languageLink);
      return html.replace('<div id="root"></div>', `<div id="root"><div>${page}</div></div>`);
    },
    handleHotUpdate({ file, server }) {
      if (file === pageFile || file === englishCopy) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  }],
});
