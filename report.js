// Insurance report: a printable inventory of the coins you own, saved as a web page file
// (open it in a browser, then print or save as PDF). Loaded after app.js.
"use strict";

function openReportForm() {
  const owned = ownedCoins();
  openSheet(`<div class="sheet-head"><h2>Insurance report</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>A dated, itemized list of the ${sum(owned, qtyOf)} coins you own, with values and totals, to keep for your records or send to your insurance agent. Sold coins aren't included.</p>
    <div class="card">
      <label class="switch"><span>Include what I paid<div class="small muted">Adds a Paid column and total.</div></span><input type="checkbox" id="repPaid"></label>
      <label class="switch"><span>Include photos<div class="small muted">Adds a small picture of each coin. Makes the file larger.</div></span><input type="checkbox" id="repPhotos"></label>
    </div>
    <label class="f"><span>Name on the report (optional)</span><input type="text" id="repName" placeholder="Your name" maxlength="80"></label>
    <div class="btn-row"><button class="btn primary" data-act="makeReport" ${owned.length ? "" : "disabled"}>Create report</button><button class="btn" data-act="closeSheet">Cancel</button></div>
    <div class="hint" id="repMsg">It saves as a file that opens in your browser. From there, print it or save it as a PDF.</div>`);
}

// Small JPEG thumbnail as a data: URL, so the report file works on its own.
async function thumbDataUrl(photo) {
  try {
    const res = await fetch(photoSrc(photo));
    const blob = await res.blob();
    const img = await decodeImage(blob);
    const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
    const s = Math.min(1, 220 / Math.max(w, h));
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * s); cv.height = Math.round(h * s);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.8);
  } catch (e) { return ""; }
}

const SOURCE_TEXT = { entered: "Owner's value", book: "Red Book", melt: "Melt" };

async function buildReport(opts) {
  const s = settings();
  const coins = ownedCoins().slice().sort((a, b) => familyOf(a).localeCompare(familyOf(b)) || (+a.year || 0) - (+b.year || 0) || normMint(a.mint).localeCompare(normMint(b.mint)));
  const totQty = sum(coins, qtyOf);
  const totVal = sum(coins, (c) => (bestEach(c) || 0) * qtyOf(c));
  const totMelt = sum(coins, (c) => (meltEach(c) || 0) * qtyOf(c));
  const paidCoins = coins.filter((c) => num(c.paid) != null);
  const totPaid = sum(paidCoins, (c) => num(c.paid) * qtyOf(c));
  const m = (n) => (n == null ? "—" : money(n));
  const ed = s.bookEdition || PRICE_BOOK.edition;

  const thumbs = {};
  if (opts.photos) {
    for (const c of coins) if ((c.photos || [])[0]) thumbs[c.id] = await thumbDataUrl(c.photos[0]);
  }

  const rows = coins.map((c, i) => {
    const v = bestEach(c), q = qtyOf(c), mt = meltEach(c);
    const certLine = c.gradeMode === "cert" && c.cert ? `<div class="sub">Cert ${esc(c.cert)}</div>` : "";
    const extra = [isInherited(c) ? "Inherited" : "", c.acquired ? "Acquired " + esc(c.acquired) : "", c.variety ? esc(c.variety) : "", c.fbl ? "Full Bell Lines" : "", c.sms ? "Special Mint Set" : ""].filter(Boolean).join(" · ");
    return `<tr>
      <td class="n">${i + 1}</td>
      ${opts.photos ? `<td class="ph">${thumbs[c.id] ? `<img src="${thumbs[c.id]}" alt="">` : ""}</td>` : ""}
      <td><b>${esc(labelOf(c))}</b>${extra ? `<div class="sub">${extra}</div>` : ""}${c.notes ? `<div class="sub">${esc(c.notes)}</div>` : ""}</td>
      <td>${esc(gradeText(c))}${certLine}</td>
      <td class="r">${q}</td>
      <td class="r">${m(v)}</td>
      <td class="r"><b>${m(v == null ? null : v * q)}</b></td>
      <td class="r">${m(mt == null ? null : mt * q)}</td>
      <td>${esc(SOURCE_TEXT[valueSource(c)] || "")}${valueSource(c) === "book" && ed ? " " + esc(ed) : ""}</td>
      ${opts.paid ? `<td class="r">${num(c.paid) == null ? "—" : money(num(c.paid))}</td>` : ""}
    </tr>`;
  }).join("");

  const byFam = {};
  coins.forEach((c) => { const f = familyOf(c); byFam[f] = byFam[f] || { n: 0, v: 0, m: 0 }; byFam[f].n += qtyOf(c); byFam[f].v += (bestEach(c) || 0) * qtyOf(c); byFam[f].m += (meltEach(c) || 0) * qtyOf(c); });
  const famRows = Object.entries(byFam).sort((a, b) => b[1].v - a[1].v).map(([f, x]) => `<tr><td>${esc(f)}</td><td class="r">${x.n}</td><td class="r">${money(x.v)}</td><td class="r">${money(x.m)}</td></tr>`).join("");
  const metalRows = SPOT_METALS.map((mt) => {
    const cs = coins.filter((c) => meltKey(c) === mt.key && num(c.oz));
    if (!cs.length) return "";
    return `<tr><td>${mt.label}</td><td class="r">${sum(cs, qtyOf)}</td><td class="r">${sum(cs, (c) => num(c.oz) * qtyOf(c)).toFixed(3)} oz</td><td class="r">${money(sum(cs, (c) => (meltEach(c) || 0) * qtyOf(c)))}</td></tr>`;
  }).join("");
  const spots = SPOT_METALS.filter((mt) => num(s.spot[mt.key]) != null).map((mt) => `${mt.label} ${money(num(s.spot[mt.key]))}/${mt.unit}`).join(", ");
  const dateLong = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const name = String(opts.name || "").trim();

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coin collection inventory – ${esc(dateLong)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f1c18; margin: 24px; font-size: 13px; line-height: 1.35; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 2px solid #9a6b1f; padding-bottom: 4px; }
  .meta { color: #6f675d; margin-bottom: 14px; }
  .sum { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin: 12px 0; }
  .sum div { border: 1px solid #e4ddd2; border-radius: 8px; padding: 8px 10px; } .sum b { display: block; font-size: 18px; } .sum span { color: #6f675d; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 6px 6px; border-bottom: 1px solid #e4ddd2; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #6f675d; background: #f6f3ee; }
  thead { display: table-header-group; } tr { break-inside: avoid; page-break-inside: avoid; }
  .r { text-align: right; white-space: nowrap; } .n { color: #6f675d; width: 22px; } .sub { color: #6f675d; font-size: 11.5px; margin-top: 2px; }
  .ph { width: 64px; } .ph img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e4ddd2; }
  tfoot td { font-weight: 700; border-top: 2px solid #1f1c18; }
  .note { color: #6f675d; font-size: 11.5px; margin-top: 18px; }
  .print { margin: 0 0 16px; padding: 8px 14px; border: 1px solid #9a6b1f; background: #9a6b1f; color: #fff; border-radius: 8px; font-size: 14px; cursor: pointer; }
  @media print { body { margin: 0; } .print { display: none; } @page { margin: 14mm; } }
</style></head><body>
<button class="print" onclick="window.print()">Print or save as PDF</button>
<h1>Coin collection inventory</h1>
<div class="meta">${name ? "Owner: " + esc(name) + " · " : ""}Prepared ${esc(dateLong)} with Coin Cabinet</div>
<div class="sum">
  <div><span>Total value</span><b>${money(totVal)}</b></div>
  <div><span>Coins</span><b>${totQty}</b></div>
  <div><span>Melt value</span><b>${money(totMelt)}</b></div>
  ${opts.paid ? `<div><span>Paid${paidCoins.length < coins.length ? " (where recorded)" : ""}</span><b>${money(totPaid)}</b></div>` : ""}
</div>
<h2>Itemized list</h2>
<table>
  <thead><tr><th>#</th>${opts.photos ? "<th>Photo</th>" : ""}<th>Coin</th><th>Grade</th><th class="r">Qty</th><th class="r">Value each</th><th class="r">Total</th><th class="r">Melt</th><th>Value basis</th>${opts.paid ? `<th class="r">Paid each</th>` : ""}</tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td></td>${opts.photos ? "<td></td>" : ""}<td>Total</td><td></td><td class="r">${totQty}</td><td></td><td class="r">${money(totVal)}</td><td class="r">${money(totMelt)}</td><td></td>${opts.paid ? `<td class="r">${money(totPaid)}</td>` : ""}</tr></tfoot>
</table>
<h2>By coin type</h2>
<table><thead><tr><th>Type</th><th class="r">Coins</th><th class="r">Value</th><th class="r">Melt</th></tr></thead><tbody>${famRows}</tbody></table>
${metalRows ? `<h2>Precious metal content</h2><table><thead><tr><th>Metal</th><th class="r">Coins</th><th class="r">Fine weight</th><th class="r">Melt value</th></tr></thead><tbody>${metalRows}</tbody></table>` : ""}
<div class="note">
  <p><b>How values were set.</b> Each coin uses the owner's own value where one was entered; otherwise the Red Book${ed ? " " + esc(ed) : ""} retail value for its grade; otherwise its melt value. Melt values use spot prices of ${spots ? esc(spots) : "(none entered)"}${s.spotUpdated ? ", as of " + esc(s.spotUpdated) : ""}.</p>
  <p>These values are the owner's estimates for record keeping. This is not a professional appraisal. Some insurers require an appraisal for high-value coins.</p>
</div>
</body></html>`;
}

async function makeReport() {
  const opts = { paid: !!($("#repPaid") || {}).checked, photos: !!($("#repPhotos") || {}).checked, name: ($("#repName") || {}).value || "" };
  const msg = $("#repMsg");
  if (msg) msg.textContent = opts.photos ? "Building the report and adding photos…" : "Building the report…";
  const html = await buildReport(opts);
  const name = "coin-collection-inventory-" + today() + ".html";
  if (downloadsApi) {
    try {
      await downloadsApi.save({ filename: name, data: html });
      closeSheet();
      toast("Report saved. Open it, then print or save as PDF.");
      return;
    } catch (e) {
      if (e && e.code === "declined") { if (msg) msg.textContent = "Not saved."; return; }
    }
  }
  if (msg) msg.textContent = "Saving files isn't available here. Open Coin Cabinet from Claude to save the report.";
}

Object.assign(actions, { openReport: openReportForm, makeReport: () => makeReport() });
