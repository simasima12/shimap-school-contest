import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist/server-rebundle");

await build({
  configFile: false,
  ssr: { noExternal: true },
  build: {
    ssr: resolve(root, "dist/server/index.js"),
    outDir: output,
    emptyOutDir: true,
    rollupOptions: {
      output: { entryFileNames: "index.js", chunkFileNames: "chunks/[name]-[hash].js" },
    },
  },
});

await cp(output, resolve(root, "dist/server"), { recursive: true, force: true });
await rm(output, { recursive: true, force: true });
