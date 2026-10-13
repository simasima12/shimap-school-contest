import { readFile, writeFile } from "node:fs/promises";

const entry = new URL("../dist/server/index.js", import.meta.url);
let source = await readFile(entry, "utf8");

if (!source.includes("__shimapWorkerHandler")) {
  const match = source.match(/,([A-Za-z_$][\w$]*) as default,/);
  if (!match) throw new Error("Worker default export was not found.");
  source = source.replace(match[0], ",");
  source += `\nexport default { fetch: (...args) => ${match[1]}(...args) };\n`;
  await writeFile(entry, source);
}
