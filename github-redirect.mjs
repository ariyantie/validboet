import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GITHUB_BASE = "https://raw.githubusercontent.com/ariyantie/validboet/main";
const FILES = {
  "akucantek.json": `${GITHUB_BASE}/akucantek.json`,
  "users.json": `${GITHUB_BASE}/users.json`,
  "baileys-version.json": `${GITHUB_BASE}/baileys-version.json`,
};

const LEGACY_PATTERNS = [
  "Bellaxata/xzxz/main/akucantek.json",
  "kiuur/bails/master/src/Defaults/baileys-version.json",
  "Badzz88/baileys/main/lib/Defaults/baileys-version.json",
];

function mapUrl(input) {
  let url = String(input);

  if (!url.includes("githubusercontent")) {
    return url;
  }

  if (url.includes("ariyantie/validboet")) {
    return url;
  }

  for (const name of Object.keys(FILES)) {
    if (url.includes(name)) {
      const mapped = FILES[name];
      console.log("[github-redirect]", url.slice(0, 80), "->", mapped);
      return mapped;
    }
  }

  for (const legacy of LEGACY_PATTERNS) {
    if (url.includes(legacy)) {
      const name = legacy.includes("akucantek")
        ? "akucantek.json"
        : legacy.includes("users")
          ? "users.json"
          : "baileys-version.json";
      const mapped = FILES[name];
      console.log("[github-redirect] legacy ->", mapped);
      return mapped;
    }
  }

  return url;
}

function applyOptions(options) {
  if (typeof options === "string") {
    const mapped = mapUrl(options);
    return mapped.startsWith("https://") ? mapped : options;
  }
  if (!options || typeof options !== "object") return options;

  const host = options.hostname || options.host || "";
  const p = options.path || "";
  const full = mapUrl(
    options.href || (host ? `https://${host}${p}` : p)
  );

  if (!full.startsWith("https://")) return options;

  const u = new URL(full);
  return {
    ...options,
    protocol: u.protocol,
    hostname: u.hostname,
    host: u.hostname,
    path: u.pathname + u.search,
    href: full,
  };
}

function patch(mod, name) {
  const origRequest = mod.request;
  mod.request = function (options, callback) {
    return origRequest.call(this, applyOptions(options), callback);
  };

  const origGet = mod.get;
  mod.get = function (options, callback) {
    return origGet.call(this, applyOptions(options), callback);
  };
}

patch(https);
patch(http);

const origFetch = globalThis.fetch;
if (typeof origFetch === "function") {
  globalThis.fetch = async function (input, init) {
    const url = mapUrl(
      typeof input === "string" ? input : input?.url || String(input)
    );
    return origFetch(url, init);
  };
}
