// Share a snapshot: a single view-only HTML file of the collection to send to friends.
// Private details are left out unless you tick them. Loaded after app.js.
"use strict";

const SNAP_FILES = ["styles.css", "catalog/data.js", "catalog/pricebook.js", "catalog/albums.js", "catalog/varieties.js", "app.js", "values.js", "views.js", "albums.js", "options.js", "coinform.js", "coinsave.js", "editforms.js", "actions.js", "sheets.js", "photofill.js", "history.js", "wants.js", "boxes.js", "report.js", "snapshot.js", "albumdb.js", "local.js", "backup.js", "whatsnew.js", "inherit.js", "welcome.js", "levels.js"];
const SNAP_PRIVATE = [
  ["paid", "What you paid"],
  ["source", "Where you got each coin"],
  ["notes", "Your notes"],
  ["sale", "Sale details (price, buyer, where sold)"],
  ["cert", "Grading cert numbers"],
  ["maxPay", "Most you'd pay for wanted coins"],
];

function openSnapshotForm() {
  openSheet(`<div class="sheet-head"><h2>Share a snapshot</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="snapForm">
    <p class="small">Saves one file you can send to anyone. They can look around but can't change anything. Deleted coins are never included.</p>
    <div class="card"><b>Include private details?</b>
      ${SNAP_PRIVATE.map(([k, l]) => `<label class="switch"><span>${l}</span><input type="checkbox" name="${k}"></label>`).join("")}
      <label class="switch"><span>Coin photos<div class="small muted">Makes the file bigger.</div></span><input type="checkbox" name="photos" checked></label>
    </div>
    <div class="hint" id="snapMsg"></div>
    <div class="btn-row"><button class="btn primary" type="submit">Save snapshot</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}

// The documents a snapshot carries, with private fields stripped.
async function snapshotDocs(inc) {
  const out = [];
  for (const [id, d0] of store.docs) {
    if (!d0) continue;
    const d = JSON.parse(JSON.stringify(d0));
    if (id.startsWith("c_")) {
      if (d.status === "deleted") continue;
      if (!inc.paid) { delete d.paid; ["buyTax", "buyShip", "buyFees", "seller", "payMethod", "receiptNo", "trackNo", "trackCarrier"].forEach((k) => delete d[k]); }
      delete d.receiptPhotos; // receipts are never shared
      if (!inc.source) delete d.source;
      if (!inc.notes) delete d.notes;
      if (!inc.cert) delete d.cert;
      if (!inc.sale && d.sold) d.sold = { date: d.sold.date };
      delete d.importBatch; delete d.prevStatus;
      if (!inc.photos) d.photos = [];
      else if ((d.photos || []).length) d.photos = (await Promise.all(d.photos.map((p) => thumbDataUrl(p).catch(() => null)))).filter(Boolean);
    } else if (id === "settings") {
      delete d.lastImport;
    } else if (id.startsWith("w_")) {
      if (!inc.notes) delete d.notes;
      if (!inc.maxPay) d.maxPrice = "";
    }
    out.push({ id, data: d });
  }
  return out;
}

async function buildSnapshot(inc) {
  const texts = await Promise.all(SNAP_FILES.map((f) => fetch(f).then((r) => { if (!r.ok) throw new Error(f); return r.text(); })));
  const css = texts[0], scripts = texts.slice(1);
  const safe = (s) => s.replace(/<\/(script|style)/gi, "<\\/$1");
  const body = document.body.cloneNode(true);
  body.querySelectorAll("script").forEach((s) => s.remove());
  body.className = "";
  body.querySelector("#view").innerHTML = "";
  ["#sheet", "#toast", "#banner"].forEach((q) => { const el = body.querySelector(q); if (el) { el.innerHTML = ""; el.hidden = true; } });
  const snap = { taken: today(), docs: await snapshotDocs(inc) };
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coin Cabinet snapshot</title><style>${safe(css)}</style></head>
<body>${body.innerHTML}
<script>window.COIN_SNAPSHOT = ${safe(JSON.stringify(snap))};</script>
${scripts.map((s) => `<script>${safe(s)}</script>`).join("\n")}
</body></html>`;
}

async function saveSnapshot(form) {
  const msg = $("#snapMsg");
  const fd = new FormData(form);
  const inc = {};
  SNAP_PRIVATE.forEach(([k]) => (inc[k] = !!fd.get(k)));
  inc.photos = !!fd.get("photos");
  if (msg) msg.textContent = "Building the snapshot…";
  let html;
  try { html = await buildSnapshot(inc); } catch (e) { if (msg) msg.textContent = "Couldn't build the snapshot here. Open Coin Cabinet from Claude and try again."; return; }
  const name = "coin-cabinet-snapshot-" + today() + ".html";
  // On the phone app: open the phone's Share menu (Messages, email, Drive...) when it can send files.
  if (store.mode === "local" && await shareFile(name, html, "text/html", "My coin collection")) { closeSheet(); return; }
  if (downloadsApi) {
    try { await downloadsApi.save({ filename: name, data: html }); closeSheet(); toast("Snapshot saved. Send the file to anyone you like."); return; }
    catch (e) { if (e && e.code === "declined") { if (msg) msg.textContent = "Not saved."; return; } }
  }
  if (msg) msg.textContent = "Saving files isn't available here. Open Coin Cabinet from Claude to save the snapshot.";
}

Object.assign(actions, { openSnapshot: () => openSnapshotForm() });
document.addEventListener("submit", (e) => {
  if (e.target.id !== "snapForm") return;
  e.preventDefault();
  saveSnapshot(e.target);
});
