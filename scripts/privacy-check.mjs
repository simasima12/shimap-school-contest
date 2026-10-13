import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", ".next", "dist", ".git"]);
const forbidden = [
  /sitesimasima123/iu,
  /simasima12/iu,
  /sou994922/iu,
  /@gmail\.com/iu,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/iu,
  /(?:^|[^0-9])0\d{1,4}-\d{1,4}-\d{3,4}(?:[^0-9]|$)/u,
  /[a-z]:\\users\\[^\\/]+/iu,
  /workers\.dev/iu,
  /data-cf-beacon/iu,
  /google-site-verification/iu,
  /INGEST_TOKEN/u,
];

async function files(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(target));
    else result.push(target);
  }
  return result;
}

const findings = [];
for (const file of await files(root)) {
  if (path.resolve(file) === path.resolve(import.meta.dirname, "privacy-check.mjs")) continue;
  if (/\.(?:png|jpe?g|ico)$/iu.test(file)) continue;
  const content = await fs.readFile(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(content)) findings.push(`${path.relative(root, file)}: ${pattern}`);
  }
}

if (findings.length) {
  console.error("個人情報または公開環境の識別子候補が見つかりました。\n" + findings.join("\n"));
  process.exit(1);
}
console.log("OK: 個人情報・公開環境識別子の既知パターンは見つかりませんでした。");
