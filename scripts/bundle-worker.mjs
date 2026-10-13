import { readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist/server-rebundle");

await build({
  configFile: false,
  define: {
    "import.meta.url": JSON.stringify("file:///index.js"),
    "import.meta.filename": JSON.stringify("/index.js"),
    "import.meta.dirname": JSON.stringify("/"),
  },
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

await rm(resolve(root, "dist/server"), { recursive: true, force: true });
await rename(output, resolve(root, "dist/server"));

const chunks = resolve(root, "dist/server/chunks");
for (const file of await readdir(chunks)) {
  if (!file.startsWith("ssr-") || !file.endsWith(".js")) continue;
  const path = resolve(chunks, file);
  const source = await readFile(path, "utf8");
  await writeFile(path, source.replace(/d\$2\(`react-dom`\)/g, "require_react_dom()"));
}
