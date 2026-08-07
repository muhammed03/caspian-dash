/**
 * Adds the `_en` twin to every localized field in the datasets.
 *
 * The datasets carry their text as `name_kk` / `name_ru` pairs. Rather than
 * threading a third language through every builder by hand, this pass walks
 * the finished JSON and writes `name_en` next to each `name_ru`, translating
 * through the table in en-terms.json.
 *
 * It is idempotent and it FAILS on an untranslated string rather than falling
 * back to Russian, so a new dataset entry cannot quietly ship as Cyrillic to
 * an English reader.
 *
 *   node scripts/pipeline/add-english.mjs [--check]
 */
import { readFile, writeFile } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;
const DATA = join(ROOT, "data");
const CHECK = process.argv.includes("--check");

const terms = JSON.parse(await readFile(join(ROOT, "scripts/pipeline/en-terms.json"), "utf8"));
delete terms._comment;

/**
 * Fields that were stored as one string with no language pair at all — units,
 * facility abbreviations, provenance notes. Each expands into a full triple,
 * replacing the bare key.
 */
const bare = JSON.parse(await readFile(join(ROOT, "scripts/pipeline/bare-terms.json"), "utf8"));
delete bare._comment;

const CYRILLIC = /[Ѐ-ӿ]/;
const missing = new Set();
const untriaged = new Set();

function translate(value) {
  if (Array.isArray(value)) return value.map(translate);
  if (typeof value !== "string") return value;
  if (Object.prototype.hasOwnProperty.call(terms, value)) return terms[value];
  // Once a bare field has been expanded, its `_ru` half comes back through
  // here on the next run — bare-terms already holds the English for it.
  if (Object.prototype.hasOwnProperty.call(bare, value)) return bare[value].en;
  missing.add(value);
  return value;
}

/** Rebuilds the object so `x_en` sits directly after `x_ru` instead of at the end. */
function walk(node) {
  if (Array.isArray(node)) return node.map(walk);
  if (!node || typeof node !== "object") return node;

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key.endsWith("_en")) continue; // rewritten from its _ru twin below

    // A bare Cyrillic string is a field nobody ever localized. Expand it into
    // the three suffixed fields so `pick` can resolve it like everything else.
    if (typeof value === "string" && CYRILLIC.test(value) && !/_(kk|ru)$/.test(key)) {
      const triple = bare[value];
      if (triple) {
        out[`${key}_kk`] = triple.kk;
        out[`${key}_ru`] = triple.ru;
        out[`${key}_en`] = triple.en;
        continue;
      }
      untriaged.add(`${key}: ${value}`);
    }

    out[key] = walk(value);
    if (key.endsWith("_ru")) out[`${key.slice(0, -3)}_en`] = translate(value);
  }
  return out;
}

function files(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(json|geojson)$/.test(entry) ? [path] : [];
  });
}

let changed = 0;
for (const path of files(DATA)) {
  const before = await readFile(path, "utf8");
  // Files with nothing to localize are left byte-for-byte alone — re-serializing
  // the big geometry files would bury the real change in a whole-file diff.
  const hasPairs = before.includes('_ru"');
  const hasBare = Object.keys(bare).some((value) => before.includes(`"${value}"`));
  if (!hasPairs && !hasBare) continue;
  const after = `${JSON.stringify(walk(JSON.parse(before)), null, 2)}\n`;
  if (after === before) continue;
  changed++;
  if (!CHECK) await writeFile(path, after);
  console.log(`${CHECK ? "would update" : "updated"}  ${relative(ROOT, path)}`);
}

if (missing.size) {
  console.error(`\n${missing.size} string(s) have no English in en-terms.json:\n`);
  for (const value of missing) console.error(`  ${JSON.stringify(value)}`);
}
if (untriaged.size) {
  console.error(`\n${untriaged.size} bare Cyrillic field(s) missing from bare-terms.json:\n`);
  for (const value of untriaged) console.error(`  ${value}`);
}
if (missing.size || untriaged.size) process.exit(1);

console.log(`\n${changed} file(s) ${CHECK ? "would change" : "changed"}, every localized field translated.`);
