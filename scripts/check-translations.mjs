import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

/**
 * Every `t("…")` key used in the app must exist in the default catalogue.
 *
 * The theme ships one catalogue; other locales are translated by the merchant
 * in Studio, keyed off this file. A key missing here therefore renders as its
 * own name and can never be translated, so this fails the build rather than
 * shipping it.
 */
const catalog = JSON.parse(readFileSync("app/locales/en.json", "utf8"));
const catalogKeys = new Set(flattenKeys(catalog));
const usedKeys = new Set();

for (const file of walk("app")) {
  if (![".ts", ".tsx"].includes(extname(file))) {
    continue;
  }
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
    usedKeys.add(match[1]);
  }
  // Keys can also be held in data and passed to `t()` later — the sort
  // options do this. Count any string literal that names a catalogue key.
  for (const match of source.matchAll(/["']([a-z][\w]*(?:\.[\w]+)+)["']/g)) {
    if (catalogKeys.has(match[1])) {
      usedKeys.add(match[1]);
    }
  }
}

const missing = [...usedKeys].filter((key) => !catalogKeys.has(key)).sort();
assert.deepEqual(
  missing,
  [],
  `Missing translation keys in app/locales/en.json: ${missing.join(", ")}`,
);

const unused = [...catalogKeys].filter((key) => !usedKeys.has(key)).sort();
if (unused.length) {
  console.warn(`Unused keys in en.json: ${unused.join(", ")}`);
}

console.log(`Verified ${usedKeys.size} translation keys in app/locales/en.json`);

function flattenKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? flattenKeys(child, path)
      : [path];
  });
}

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}
