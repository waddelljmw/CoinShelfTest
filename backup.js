// Backup and Restore: everything (coins, albums, want lists, settings, value history and photos)
// in one file. Works in Claude and on its own; it's also how coins move from Claude to the phone app.
"use strict";

const BACKUP_KIND = "coin-cabinet-backup";
const BACKUP_REMIND_DAYS = 30;

const blobToDataUrl = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
const dataUrlToBlob = async (u) => (await fetch(u)).blob();

// Every photo a record points to, as a data: URL keyed the way the record points to it.
const isPocketDoc = (d) => !!d && d.kind === "box" && d.type === "pocket"; // pocket albums count as albums
let backupSkipped = 0; // photos the last backup couldn't read
async function collectPhotos(onProgress) {
  backupSkipped = 0;
  const refs = new Map();
  store.docs.forEach((d) => photoRefsOf(d).forEach((p) => { if (p) { const k = p.lid ? "lid:" + p.lid : p.id ? "id:" + p.id : null; if (k) refs.set(k, p); } }));
  const out = {};
  let n = 0;
  for (const [k, p] of refs) {
    n++;
    if (onProgress) onProgress(n, refs.size);
    try { const blob = await (await fetch(photoSrc(p))).blob(); out[k] = await blobToDataUrl(blob); } catch (e) { backupSkipped++; /* a missing photo doesn't stop the backup, but we count it and say so */ }
  }
  return out;
}
async function buildBackup(onProgress) {
  const docs = [];
  store.docs.forEach((data, id) => { if (data) docs.push({ id, data }); });
  const photos = await collectPhotos(onProgress);
  return {
    kind: BACKUP_KIND, format: 1, dataVersion: DATA_VERSION, appVersion: APP_VERSION, made: today(),
    counts: { coins: allCoins().filter((c) => c.status !== "deleted").length, albums: albums().length + docs.filter((d) => isPocketDoc(d.data)).length, photos: Object.keys(photos).length },
    docs, photos,
  };
}

function openBackupSheet() {
  const s = settings();
  const n = allCoins().filter((c) => c.status !== "deleted").length;
  const inClaude = store.mode === "db";
  openSheet(`<div class="sheet-head"><h2>Backup and restore</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="card"><b>Save a backup</b>
      <p class="small">One file with all ${n} coin${n === 1 ? "" : "s"}, albums, want lists, settings and photos. Keep it somewhere safe, like Google Drive or email it to yourself.${inClaude ? " This is also how you move your coins into the Coin Cabinet app on your phone." : ""}</p>
      ${s.lastBackup ? `<div class="small muted">Last backup: ${esc(s.lastBackup)}</div>` : ""}
      <div class="btn-row"><button class="btn primary" data-act="doBackup">Save backup file</button></div>
      <div class="hint" id="backupMsg"></div></div>
    <div class="card"><b>Restore from a backup</b>
      <p class="small">Adds everything from a backup file to this ${inClaude ? "Claude version" : "device"}. Nothing here is deleted. If a coin is in both, the backup's copy replaces this one.</p>
      <label class="btn block file-btn" style="display:block;text-align:center">Choose backup file<input type="file" accept=".json,application/json" id="restoreFile"></label>
      <div class="hint" id="restoreMsg"></div></div>`);
}

async function doBackup() {
  const msg = $("#backupMsg");
  const say = (t) => { if (msg) msg.textContent = t; };
  say("Making the backup…");
  let data;
  try { data = await buildBackup((i, n) => say("Adding photos (" + i + " of " + n + ")…")); }
  catch (e) { say("Couldn't make the backup. Try again."); return; }
  const name = "coin-cabinet-backup-" + today() + ".json";
  if (!downloadsApi) { say("Saving files isn't available here."); return; }
  try {
    await downloadsApi.save({ filename: name, data: JSON.stringify(data), type: "application/json" });
  } catch (e) { say(e && e.code === "declined" ? "Not saved." : "Couldn't save the file. Try again."); return; }
  saveSettings({ lastBackup: today() });
  say("Saved " + name + " (" + data.counts.coins + " coins, " + data.counts.photos + " photos)." + (backupSkipped ? " Warning: " + backupSkipped + " photo" + (backupSkipped === 1 ? "" : "s") + " couldn't be added." : ""));
}

// Settings and value history are combined with what's on this device, not replaced.
let restoreRenumbered = 0, restoreIncoming = new Set(), restoreDone = new Set();
function mergeRestored(id, body) {
  const here = store.docs.get(id);
  if (id.startsWith("c_")) {
    // Coin IDs: keep the one on this device if the backup has none; drop one another coin already uses (it gets a fresh number).
    if (here && here.cid && !body.cid) body = { ...body, cid: here.cid };
    // Only a clash with a coin that stays: coins in this backup are about to be replaced (unless already restored).
    const me = body.id || id.slice(2), k = body.cid && typeof idNormKey === "function" ? idNormKey(body.cid) : "";
    if (k && allCoins().some((o) => o.id !== me && (!restoreIncoming.has(o.id) || restoreDone.has(o.id)) && [o.cid, ...(o.oldCids || [])].some((x) => x && idNormKey(x) === k))) { const { cid, ...rest } = body; body = rest; restoreRenumbered++; }
    restoreDone.add(me);
    return body;
  }
  if (!here) return body;
  // Price list: a list with prices beats an empty one; otherwise the later-saved one wins, so an old backup can't put older prices over newer ones.
  if (id === "pricebook") return body && !Object.keys(here.series || {}).length && Object.keys(body.series || {}).length ? body : body && body.savedAt && String(body.savedAt) > String(here.savedAt || "") ? body : here;
  if (id === "history") return { ...body, ...here, days: { ...(body.days || {}), ...(here.days || {}) } };
  if (id === "settings") {
    const out = { ...body };
    // A setting counts as "set on this device" only if it differs from the default (a brand-new app saves all defaults).
    const isDefault = (k, v) => k in DEFAULT_SETTINGS && JSON.stringify(v) === JSON.stringify(DEFAULT_SETTINGS[k]);
    Object.entries(here).forEach(([k, v]) => { if (v != null && v !== "" && !(Array.isArray(v) && !v.length) && k !== "spot" && !isDefault(k, v)) out[k] = v; });
    out.spot = { ...(body.spot || {}) };
    Object.entries(here.spot || {}).forEach(([m, v]) => { if (v != null && v !== "") out.spot[m] = v; });
    const order = [...(here.albumOrder || []), ...(body.albumOrder || [])];
    if (order.length) out.albumOrder = [...new Set(order)];
    // Inheritances: keep both lists, joined by id (this device's copy wins when both have the same one).
    const inh = new Map();
    [...(body.inheritances || []), ...(here.inheritances || [])].forEach((i) => { if (i && i.id) inh.set(i.id, i); });
    if (inh.size) out.inheritances = [...inh.values()];
    out.inhDefault = here.inhDefault || body.inhDefault;
    out.dataVersion = Math.max(num(here.dataVersion) || 0, num(body.dataVersion) || 0) || DATA_VERSION; // never goes down
    return out;
  }
  return body;
}
// Restore: read the file, check it, then ask before adding.
let restorePending = null;
async function readRestoreFile(file) {
  const msg = $("#restoreMsg");
  const say = (t) => { if (msg) msg.textContent = t; };
  say("Reading the file…");
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { say("That isn't a Coin Cabinet backup file."); return; }
  if (!data || data.kind !== BACKUP_KIND || !Array.isArray(data.docs)) { say("That isn't a Coin Cabinet backup file."); return; }
  if (data.format > 1 || num(data.dataVersion) > DATA_VERSION) { say("This backup was made by a newer version of Coin Cabinet. Update the app first, then restore."); return; }
  restorePending = data;
  const coins = data.docs.filter((d) => d.data && d.data.kind === "coin" && d.data.status !== "deleted").length;
  const replaces = data.docs.filter((d) => d.data && d.data.kind === "coin" && store.docs.has(d.id)).length;
  confirmSheet("Restore this backup?",
    `Backup from ${String(data.made || "").slice(0, 10) || "an unknown date"}: ${coins} coins, ${data.docs.filter((d) => d.data && (d.data.kind === "album" || isPocketDoc(d.data))).length} albums, ${Object.keys(data.photos || {}).length} photos.` +
    (replaces ? ` ${replaces} coin${replaces === 1 ? " is" : "s are"} already here and will be replaced by the backup's copy.` : "") +
    " Albums and want lists that are in both are replaced by the backup's copy too. Your settings and value history here are kept and combined with the backup's. Nothing here is deleted.",
    "Restore", () => doRestore());
}
async function doRestore() {
  const data = restorePending;
  restorePending = null;
  if (!data) return;
  toast("Restoring… keep this page open.");
  // 1) Photos: put each one where this version keeps photos, and remember its new address.
  const newRef = new Map();
  let failed = 0;
  for (const [k, url] of Object.entries(data.photos || {})) {
    try {
      const blob = await dataUrlToBlob(url);
      if (store.mode === "local") newRef.set(k, { lid: await localAddPhoto(blob) });
      else if (store.mode === "db" && assetsApi) newRef.set(k, { id: (await assetsApi.upload(blob)).id });
      else newRef.set(k, { url: URL.createObjectURL(blob) });
    } catch (e) { failed++; }
  }
  const fix = (p) => { const k = p && (p.lid ? "lid:" + p.lid : p.id ? "id:" + p.id : null); return (k && newRef.get(k)) || p; };
  restoreRenumbered = 0; restoreDone = new Set();
  restoreIncoming = new Set(data.docs.filter((x) => x && x.id && x.id.startsWith("c_")).map((x) => (x.data && x.data.id) || x.id.slice(2)));
  // 2) Records, one at a time so large backups don't overwhelm saving.
  for (const { id, data: d } of data.docs) {
    if (!id || !d) continue;
    const fixAll = (list) => list.map(fix).filter((p) => p && (p.lid || p.id || p.url));
    const body = { ...d };
    if (Array.isArray(d.photos)) body.photos = fixAll(d.photos);
    if (Array.isArray(d.receiptPhotos)) body.receiptPhotos = fixAll(d.receiptPhotos);
    await put(id, mergeRestored(id, body));
  }
  if (store.mode === "local") cleanUnusedPhotos();
  go("home");
  toast("Restored " + data.docs.filter((d) => d.data && d.data.kind === "coin").length + " coins." + (failed ? " " + failed + " photo" + (failed === 1 ? "" : "s") + " couldn't be restored." : "") + (restoreRenumbered ? " " + restoreRenumbered + " coin ID" + (restoreRenumbered === 1 ? " was" : "s were") + " already in use, so " + (restoreRenumbered === 1 ? "it got a new number." : "they got new numbers.") : ""));
}

// A gentle reminder on Home when the last backup is old (only once there are coins worth protecting).
function backupReminder() {
  if (store.mode === "snapshot" || store.mode === "memory" || store.mode === "loading" || store.mode === "demo") return "";
  const n = allCoins().filter((c) => c.status !== "deleted").length;
  if (!n) return "";
  const last = settings().lastBackup;
  const days = last ? Math.floor((Date.now() - new Date(last + "T12:00:00").getTime()) / 86400000) : Infinity;
  if (days < BACKUP_REMIND_DAYS) return "";
  return `<div class="banner" style="margin:0 0 12px">${last ? "Your last backup was " + days + " days ago." : "You haven't saved a backup yet."} <button class="link-btn" data-act="openBackup">Back up now</button></div>`;
}

Object.assign(actions, {
  openBackup: () => { closeMenu(); openBackupSheet(); },
  doBackup: () => doBackup(),
});
document.addEventListener("change", (e) => {
  if (e.target.id === "restoreFile" && e.target.files && e.target.files[0]) readRestoreFile(e.target.files[0]);
});
