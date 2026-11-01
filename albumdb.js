// Album lookup: type "Whitman 9122" and the app fills in the coin types, years and proof spots.
// Built from the brands' own product listings (Whitman, Dansco, H.E. Harris). Loaded after app.js.
"use strict";


// Finds an album by brand and number, or null. Fills in "to date" years.
function lookupAlbum(brand, number) {
  let n = String(number || "").trim().replace(/^#/, "").replace(/\s+/g, "").toUpperCase();
  if (brand === "Littleton" && /^\d+[A-Z]*$/.test(n)) n = "LCA" + n; // "4" and "LCA4" are the same album
  const e = n && ALBUM_DB[brand + "|" + n];
  if (!e) return null;
  const types = e.types.filter((id) => TYPE_BY_ID[id]);
  if (!types.length) return null;
  const last = Math.max(...types.map((id) => typeLastYear(TYPE_BY_ID[id])));
  return { brand, number: n, name: e.name, types, start: e.start, end: e.end || last, proofs: e.proofs || "", toDate: !e.end };
}
// Proofs only apply if the app has proof dates for these types. Returns "", "s" or "all".
const lookupProofs = (info) => (info.proofs && hasProofs(info.types) ? info.proofs : "");

/* ---- the New album / Edit album forms ---- */
let albumInfoPending = null;
function albumLookupMessage(info, applied) {
  const noProof = info.proofs && !lookupProofs(info);
  return `${applied ? "Filled in from" : "Found"}: <b>${esc(info.brand)} ${esc(info.number)}</b>, ${esc(info.name)}. ${applied ? "Check it against your album and change anything that's different." : ""}
    ${noProof ? `<div>This album has proof spots, but the app doesn't have proof dates for these coins yet. Add them with + Add a spot.</div>` : ""}`;
}
function applyAlbumInfo(form, info) {
  const f = (n) => form.querySelector("[name=" + n + "]");
  const nm = f("name");
  if (nm && (!nm.value.trim() || nm.value === form.dataset.autoName)) { nm.value = info.name; form.dataset.autoName = info.name; }
  const box = $("#albumTypes");
  if (box) box.innerHTML = info.types.map(albumTypeRow).join("");
  if (f("start")) f("start").value = info.start;
  if (f("end")) f("end").value = info.end;
  if (f("proofs")) f("proofs").value = lookupProofs(info);
  if (f("layout")) f("layout").value = "dates";
}
function albumFormLookup(form) {
  const info = lookupAlbum(form.querySelector("[name=brand]").value, form.querySelector("[name=number]").value);
  const hint = $("#albumLookupHint");
  albumInfoPending = info;
  if (!hint) return;
  if (!info) { hint.innerHTML = ""; delete form.dataset.found; delete form.dataset.shown; return; }
  // Leave the hint alone if it already shows this album (re-drawing it would swallow a tap on its button).
  const key = info.brand + "|" + info.number;
  if (form.dataset.shown === key) return;
  form.dataset.shown = key;
  if (form.id === "albumForm" && !form.dataset.touched) {
    // New album: fill everything in right away.
    if (form.dataset.found !== info.brand + info.number) { applyAlbumInfo(form, info); form.dataset.found = info.brand + info.number; }
    hint.innerHTML = albumLookupMessage(info, true);
  } else {
    // Existing album: only on request, so nothing you set up is overwritten.
    hint.innerHTML = albumLookupMessage(info, false) + ` <button type="button" class="link-btn" data-act="albumApplyDb">Use these coin types and years</button>`;
  }
}
// Once you change the types or years yourself, a new brand/number never overwrites them.
document.addEventListener("change", (e) => {
  const f = e.target.form;
  if (f && f.id === "albumForm" && ["start", "end", "typeId", "proofs", "layout"].includes(e.target.name) && e.isTrusted) f.dataset.touched = "1";
});
document.addEventListener("input", (e) => {
  const f = e.target.form;
  if (f && f.id === "albumForm" && ["start", "end"].includes(e.target.name) && e.isTrusted) f.dataset.touched = "1";
  if (f && (f.id === "albumForm" || f.id === "editAlbumForm") && e.target.name === "number") albumFormLookup(f);
});
document.addEventListener("change", (e) => {
  const f = e.target.form;
  if (f && (f.id === "albumForm" || f.id === "editAlbumForm") && (e.target.name === "brand" || e.target.name === "number")) albumFormLookup(f);
});
Object.assign(actions, {
  albumApplyDb: () => {
    const f = $("#editAlbumForm");
    if (f && albumInfoPending) { applyAlbumInfo(f, albumInfoPending); toast("Filled in. Tap Save to keep it."); }
  },
});
