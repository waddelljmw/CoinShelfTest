// Guard (Step 11.3): no real price list may be in the public files. Fails if the old price files come back,
// if any file other than tests/fixtures/prices.json holds a price table, or if the made-up list grows past 60 rows.
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
ok("catalog/pricebook*.js are gone", !fs.readdirSync(path.join(root, "catalog")).some((f) => /^pricebook/.test(f)));
const skip = new Set([".git", "node_modules"]);
const files = [];
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { if (skip.has(e.name)) return; const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.(js|html|json|webmanifest|css|md|csv|txt)$/.test(e.name)) files.push(f); }); })(root);
const fixture = path.join(root, "tests", "fixtures", "prices.json");
const tableLike = [/"rows"\s*:\s*\{\s*"\d{4}/, /\brows\s*:\s*\{\s*"\d{4}/, /"\d{4}(-[A-Z]{1,2})?(\|[^"]*)?"\s*:\s*\[\s*\d+(\.\d+)?\s*,\s*(\d+(\.\d+)?|null)\s*,/];
const hits = files.filter((f) => f !== fixture && tableLike.some((re) => re.test(fs.readFileSync(f, "utf8")))).map((f) => path.relative(root, f));
ok("no file outside the fixture holds a price table" + (hits.length ? " (" + hits.join(", ") + ")" : ""), hits.length === 0);
const fx = JSON.parse(fs.readFileSync(fixture, "utf8"));
let rows = 0; Object.values(fx.series).forEach((k) => Object.values(k).forEach((t) => { rows += Object.keys(t.rows).length; }));
ok("the made-up list has at most 60 rows (" + rows + ")", rows > 0 && rows <= 60);
ok("the made-up list says it is made up", fx.source === "Test Book" && fx.edition === "Made-up");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
ok("index.html and sw.js don't mention the price files", !/pricebook/.test(html) && !/catalog\/pricebook/.test(sw));
ok("pricefile.js is in index.html and sw.js", /pricefile\.js/.test(html) && /pricefile\.js/.test(sw));
