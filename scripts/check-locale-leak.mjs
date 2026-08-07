/**
 * Fails if the English pages still contain Cyrillic.
 *
 * The site is server-rendered, so the HTML returned for `Cookie: locale=en`
 * should hold no Cyrillic at all. Every hit is a string somebody forgot to
 * translate — this is the check that catches a missed conditional.
 *
 * There is deliberately no equivalent check for Kazakh-vs-Russian: the Kazakh
 * alphabet contains щ, ъ, ы and э too, so no letter set separates them. That
 * direction is covered by the compiler instead — every localized table is a
 * `Trio`, which cannot be built with a language missing.
 *
 *   node scripts/check-locale-leak.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

const ROUTES = [
  "/",
  "/map/water",
  "/map/pollution",
  "/map/life",
  "/map/resources",
  "/map/index",
  "/methodology",
];

const CYRILLIC = /[Ѐ-ӿ]/g;

/**
 * The only Cyrillic an English page may legitimately contain. The language
 * switcher names each language in its own script — that is the point of it —
 * and a couple of institution names have no English rendering.
 */
const ALLOWED = [
  "ҚАЗ",
  "РУС",
  "П.П. Ширшова",
  "РАН",
];

/** Text nodes only: attributes, scripts and inlined JSON are not what the reader sees. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ");
}

function context(text, index, span = 45) {
  return text
    .slice(Math.max(0, index - span), index + span)
    .replace(/\s+/g, " ")
    .trim();
}

let failures = 0;

for (const route of ROUTES) {
  const res = await fetch(BASE + route, { headers: { Cookie: "locale=en" } });
  if (!res.ok) {
    console.error(`✗ ${route} — HTTP ${res.status}`);
    failures++;
    continue;
  }

  let text = visibleText(await res.text());
  for (const allowed of ALLOWED) text = text.split(allowed).join(" ");

  const hits = [];
  for (const match of text.matchAll(CYRILLIC)) {
    const snippet = context(text, match.index);
    if (!hits.includes(snippet)) hits.push(snippet);
    if (hits.length >= 8) break;
  }

  if (hits.length === 0) {
    console.log(`✓ ${route}`);
  } else {
    failures++;
    console.error(`✗ ${route} — Cyrillic in the English page:`);
    for (const hit of hits) console.error(`      …${hit}…`);
  }
}

if (failures) {
  console.error(`\n${failures} of ${ROUTES.length} route(s) still show Cyrillic in English.`);
  process.exit(1);
}
console.log(`\nAll ${ROUTES.length} routes are free of Cyrillic in English.`);
