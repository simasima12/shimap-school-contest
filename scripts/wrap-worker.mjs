import { readFile, writeFile } from "node:fs/promises";

const entry = new URL("../dist/server/index.js", import.meta.url);
let source = await readFile(entry, "utf8");

if (!source.includes("__shimapWorkerHandler")) {
  source = source.replace(/,([A-Za-z_$][\w$]*) as default,/, ",$1 as __shimapWorkerHandler,");
  source += "\nexport default { fetch: (...args) => __shimapWorkerHandler(...args) };\n";
  await writeFile(entry, source);
}
