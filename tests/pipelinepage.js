// Process update 11-19: the pipeline page loads, shows Questions box, road, Test checklist, Notes inbox; ticks/notes/answers save through a stand-in db.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
(async () => {
  const root = path.resolve(__dirname, "../pipeline");
  const srv = http.createServer((q, r) => { const f = path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { "content-type": f.endsWith(".json") ? "application/json" : "text/html" }); r.end(b); } }); }).listen(0);
  const port = srv.address().port;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => {
    const docs = new Map(), subs = [];
    const fire = () => subs.forEach((s) => s());
    const snapDocs = (col) => [...docs].filter(([k]) => k.startsWith(col + "/") && !k.slice(col.length + 1).includes("/")).map(([k, v]) => ({ id: k.split("/").pop(), data: () => v }));
    const mkdoc = (path) => ({ set: async (d) => { docs.set(path, d); fire(); }, update: async (d) => { docs.set(path, { ...(docs.get(path) || {}), ...d }); fire(); } });
    const db = { doc: mkdoc, collection: (c) => ({ add: async (d) => { docs.set(c + "/n" + docs.size, d); fire(); }, onSnapshot: (next) => { const s = () => next({ docs: snapDocs(c) }); subs.push(s); setTimeout(s, 0); return () => {}; } }) };
    window.__docs = docs;
    window.claude = { use: async (n) => (n === "db" ? db : null) };
  });
  await p.goto("http://127.0.0.1:" + port + "/"); await p.waitForTimeout(500);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  ok("empty Questions box says nothing waiting", /Nothing waiting on you/.test(await p.textContent("#qbox")));
  { const pj = JSON.parse(fs.readFileSync(path.join(root, "pipeline.json"), "utf8")); const exp = (pj.steps.find((s) => s.status === "next") || {}).n; const hereTxt = await p.textContent("#here"); const nextS = pj.steps.find((s) => s.status === "next"); const today = new Date().toISOString().slice(0, 10); const nextWaits = nextS && nextS.after && today < nextS.after; ok(nextWaits ? "all remaining steps waiting (next is step " + exp + ", waits for " + nextS.after + ")" : "YOU ARE HERE is the next ready step (step " + exp + ")", nextWaits ? /All remaining steps are waiting/.test(hereTxt) : new RegExp("YOU ARE HERE: step " + exp + "\\b").test(hereTxt)); }
  ok("waiting steps are faded in the road", (await p.$$(".dot.wait")).length >= 3);
  { const pj = JSON.parse(fs.readFileSync(path.join(root, "pipeline.json"), "utf8")); const n = pj.steps.filter((s) => s.status === "done").length - (pj.checkin.review_baseline || 0); const txt = await p.textContent("#checkin"); ok("Weekly check-in card matches the review rule (" + n + " steps since review) and shows suggested days", (n >= 8 ? /Review due/.test(txt) : /No review due yet/.test(txt)) && /Suggested: Mon/.test(txt)); }
  ok("Queue low warning matches the ready count (shows only when fewer than 3 are ready)", (await p.$eval("#qlow", (e) => e.hidden)) === (await p.evaluate(() => D.steps.filter(ready).length >= 3)));
  await p.evaluate(() => { D.steps.filter((s) => s.status !== "done" && s.n !== 16).forEach((s) => { s.status = "done"; }); renderAll(); });
  ok("Queue low warning shows when fewer than 3 steps are ready", !(await p.$eval("#qlow", (e) => e.hidden)) && /Queue low/.test(await p.textContent("#qlow")));
  await p.evaluate(() => location.reload()); await p.waitForTimeout(500);
  await p.evaluate(() => { const s = D.steps.find((x) => x.status !== "done"); if (s) { delete s.after; delete s.needs; } renderAll(); }); // 15d: when everything is waiting, free the first step so the prompt builder can be tried
  await p.fill("#use", "18/57"); await p.click('[data-m="keep"]');
  ok("prompt has mode and usage", /keep going to \d+%/.test(await p.textContent("#np")));
  await p.fill("#use", "18/57");
  ok("usage lands in prompt", /Usage: \[18\/57\]/.test(await p.textContent("#np")));
  await p.evaluate(() => window.__docs.set("questions/q1", { q: "Which 9 checks?", asked: "11-19", status: "open" })); await p.evaluate(() => { document.querySelector('[data-t="n"]').click(); });
  await p.click('[data-t="t"]'); await p.waitForTimeout(100);
  await p.click("#test input[data-id]"); await p.waitForTimeout(150);
  ok("a test tick is saved", await p.evaluate(() => [...window.__docs].some(([k, v]) => k.startsWith("ticks/") && v.done)));
  await p.click('[data-t="n"]'); await p.fill("#nt", "buy a loupe"); await p.check("#nb"); await p.click("#ns"); await p.waitForTimeout(150);
  ok("note saved and listed with blocks chip", /buy a loupe/.test(await p.textContent("#notes")) && /blocks entering coins/.test(await p.textContent("#notes")));
  await p.click("[data-t=h]"); await p.click(".dot >> nth=0"); await p.waitForTimeout(100);
  ok("tapping a bubble shows the Queue", !(await p.$eval("#tab-q", (e) => e.hidden)));
  ok("no page errors", errors.length === 0);
  if (process.env.SHOT) { await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: process.env.SHOT }); await p.click('[data-t="t"]'); await p.screenshot({ path: process.env.SHOT.replace(".png", "-t.png") }); }
  await b.close(); srv.close();
})();
