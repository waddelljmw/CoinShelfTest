// "What's new": a short list of plain lines per version. Fixes-only versions have no entry and show nothing.
const WHATS_NEW = {
  "0.43.0": [
    "A coin can be on several want lists at once, each with its own grade. Album spots and the Want List show \u201Cwanted \u00D72\u201D; tap it to see which lists.",
    "Album page: \u201CAdd missing to a want list\u201D suggests a list for that coin type, or makes a new one.",
    "On a filled album spot, \u201CWant an upgrade\u201D adds the next grade up.",
    "Want List has a new section for albums you want to buy."
  ],
  "0.42.0": [
    "Home shows an amber line when some coins need info (grade, cost or date inherited); tap it to see them.",
    "Totals say \u201Cestimate*\u201D until those coins are filled in.",
    "Options has an Inheritances list: who, when, earlier owners. Inherited coins use your default one.",
    "In My Coins, Select \u203A Mark inherited\u2026 fixes many coins at once."
  ],
  "0.41.0": [
    "The Save button now stays at the bottom of the screen while you fill in a coin.",
    "After you delete or sell a coin, you land back where you came from (like your album).",
    "New album: type a few letters to find the coin type, and the name is suggested in gray.",
    "An album can be marked Inherited; coins you add from it start as Inherited."
  ]
};
const verNum = (v) => String(v).split(".").reduce((n, x) => n * 1000 + (+x || 0), 0);
// Entries newer than the last version he saw, up to this one (newest first).
function newSince(seen) {
  return Object.keys(WHATS_NEW).filter((v) => verNum(v) <= verNum(APP_VERSION) && verNum(v) > verNum(seen || "0")).sort((a, b) => verNum(b) - verNum(a));
}
function whatsNewHtml(vs) {
  return vs.map((v) => `<h3 style="margin:10px 0 4px">Version ${esc(v)}</h3><ul style="margin:0 0 6px;padding-left:20px">${WHATS_NEW[v].map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`).join("");
}
function openWhatsNew(all, vsGiven) {
  const vs = vsGiven || (all ? Object.keys(WHATS_NEW).sort((a, b) => verNum(b) - verNum(a)) : newSince(settings().seenVersion));
  if (!vs.length) { if (all) toast("Nothing new to show yet."); return; }
  openSheet(`<div class="sheet-head"><h2>What's new</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>${whatsNewHtml(vs)}<div class="btn-row"><button class="btn primary" data-act="closeSheet">Got it</button></div>`);
}
// Once after an update. A first-ever start (no coins, nothing seen) just records the version.
function maybeShowWhatsNew() {
  if (store.mode === "snapshot" || store.mode === "loading" || /[?&]demo/.test(location.search)) return;
  const s = settings(), seen = s.seenVersion;
  if (seen === APP_VERSION) return;
  const fresh = !seen && !allCoins().length;
  const vs = newSince(seen);
  saveSettings({ seenVersion: APP_VERSION });
  if (!fresh && vs.length) openWhatsNew(false, vs);
}
