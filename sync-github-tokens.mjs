import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const LICENSE_URL =
  "https://raw.githubusercontent.com/ariyantie/validboet/main/akucantek.json";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

const config = require("./settings/config.js");
const license = await fetchJson(LICENSE_URL);

const tokens = Array.isArray(license.tokens) ? license.tokens : [];
const token = config.tokenBot;

if (!tokens.includes(token)) {
  license.tokens = [...new Set([...tokens, token])];
  console.warn(
    "[sync-github-tokens] Token ditambahkan ke salinan lokal (push ke GitHub disarankan)"
  );
}

license.status = license.status ?? true;
license.active = license.active ?? true;

const localPath = path.join(__dirname, "akucantek.json");
fs.writeFileSync(localPath, JSON.stringify(license, null, 2) + "\n");

const match = license.tokens.includes(token);
console.log("[sync-github-tokens] Sumber:", LICENSE_URL);
console.log("[sync-github-tokens] Token valid:", match ? "YA" : "TIDAK");

if (!match) {
  process.exit(1);
}
