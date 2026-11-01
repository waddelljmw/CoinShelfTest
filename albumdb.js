// Album lookup: type "Whitman 9122" and the app fills in the coin types, years and proof spots.
// Built from the brands' own product listings (Whitman, Dansco, H.E. Harris). Loaded after app.js.
"use strict";

// end: 0 means "to date" (as far as the coin types go). proofs: "" | "s" (S proofs, 1968 on) | "all".
const ALBUM_DB = {
  // Whitman Classic albums
  "Whitman|9111": { name: "Flying Eagle and Indian Head Cents 1856–1909", types: ["flying-eagle-cent", "indian-cent"], start: 1856, end: 1909 },
  "Whitman|9112": { name: "Lincoln Cents 1909–1995", types: ["lincoln-wheat", "lincoln-memorial-copper", "lincoln-memorial-zinc"], start: 1909, end: 1995 },
  "Whitman|9141": { name: "Lincoln Memorial Cents 1959–2007", types: ["lincoln-memorial-copper", "lincoln-memorial-zinc"], start: 1959, end: 2007 },
  "Whitman|9114": { name: "Liberty Head Nickels 1883–1912", types: ["liberty-nickel"], start: 1883, end: 1912 },
  "Whitman|9115": { name: "Buffalo Nickels 1913–1938", types: ["buffalo-nickel"], start: 1913, end: 1938 },
  "Whitman|9116": { name: "Jefferson Nickels 1938–2003", types: ["jefferson-nickel", "jefferson-war-nickel"], start: 1938, end: 2003 },
  "Whitman|9117": { name: "Barber Dimes 1892–1916", types: ["barber-dime"], start: 1892, end: 1916 },
  "Whitman|9118": { name: "Mercury Dimes 1916–1945", types: ["mercury-dime"], start: 1916, end: 1945 },
  "Whitman|9120": { name: "Barber Quarters 1892–1916", types: ["barber-quarter"], start: 1892, end: 1916 },
  "Whitman|9121": { name: "Standing Liberty Quarters 1916–1930", types: ["standing-liberty-quarter"], start: 1916, end: 1930 },
  "Whitman|9122": { name: "Washington Quarters 1932–1990", types: ["washington-silver", "washington-clad"], start: 1932, end: 1990, proofs: "s" },
  "Whitman|9123": { name: "Washington Quarters 1991–1998", types: ["washington-clad"], start: 1991, end: 1998, proofs: "s" },
  "Whitman|9124": { name: "Barber Half Dollars 1892–1915", types: ["barber-half"], start: 1892, end: 1915 },
  "Whitman|9125": { name: "Walking Liberty Half Dollars 1916–1947", types: ["walking-liberty-half"], start: 1916, end: 1947 },
  "Whitman|9126": { name: "Franklin Half Dollars 1948–1963", types: ["franklin-half"], start: 1948, end: 1963 },
  "Whitman|9127": { name: "Kennedy Half Dollars 1964–2002", types: ["kennedy-90", "kennedy-40", "kennedy-clad"], start: 1964, end: 2002, proofs: "all" },
  "Whitman|9128": { name: "Morgan Dollars Vol. 1, 1878–1891", types: ["morgan-dollar"], start: 1878, end: 1891 },
  "Whitman|9129": { name: "Morgan Dollars Vol. 2, 1892–1921", types: ["morgan-dollar"], start: 1892, end: 1921 },
  "Whitman|9130": { name: "Peace Dollars 1921–1935", types: ["peace-dollar"], start: 1921, end: 1935 },
  "Whitman|9131": { name: "Eisenhower Dollars 1971–1978", types: ["ike-clad", "ike-40"], start: 1971, end: 1978 },
  // Dansco Supreme albums ("7xxx" has no proofs, "8xxx" has proofs)
  "Dansco|7100": { name: "Lincoln Cents 1909–2009", types: ["lincoln-wheat", "lincoln-memorial-copper", "lincoln-memorial-zinc", "lincoln-bicentennial"], start: 1909, end: 2009 },
  "Dansco|7101": { name: "Flying Eagle and Indian Head Cents 1857–1909", types: ["flying-eagle-cent", "indian-cent"], start: 1857, end: 1909 },
  "Dansco|7102": { name: "Lincoln Memorial Cents 1959–2009", types: ["lincoln-memorial-copper", "lincoln-memorial-zinc", "lincoln-bicentennial"], start: 1959, end: 2009 },
  "Dansco|7103": { name: "Lincoln Cents 1909–1958", types: ["lincoln-wheat"], start: 1909, end: 1958 },
  "Dansco|7104": { name: "Lincoln Shield Cents 2010 to date", types: ["lincoln-shield"], start: 2010, end: 0 },
  "Dansco|7111": { name: "Liberty Nickels 1883–1912", types: ["liberty-nickel"], start: 1883, end: 1912 },
  "Dansco|7112": { name: "Buffalo Nickels 1913–1938", types: ["buffalo-nickel"], start: 1913, end: 1938 },
  "Dansco|7113": { name: "Jefferson Nickels 1938–2005", types: ["jefferson-nickel", "jefferson-war-nickel"], start: 1938, end: 2005 },
  "Dansco|7123": { name: "Mercury Dimes 1916–1945", types: ["mercury-dime"], start: 1916, end: 1945 },
  "Dansco|7125": { name: "Roosevelt Dimes 1946 to date", types: ["roosevelt-silver", "roosevelt-clad"], start: 1946, end: 0 },
  "Dansco|8125": { name: "Roosevelt Dimes 1946 to date, with proofs", types: ["roosevelt-silver", "roosevelt-clad"], start: 1946, end: 0, proofs: "all" },
  "Dansco|7140": { name: "Washington Quarters 1932–1998", types: ["washington-silver", "washington-clad"], start: 1932, end: 1998 },
  "Dansco|8140": { name: "Washington Quarters 1932–1998, with proofs", types: ["washington-silver", "washington-clad"], start: 1932, end: 1998, proofs: "all" },
  "Dansco|7150": { name: "Liberty Head Half Dollars 1892–1915", types: ["barber-half"], start: 1892, end: 1915 },
  "Dansco|7160": { name: "Liberty Walking Half Dollars 1916–1947", types: ["walking-liberty-half"], start: 1916, end: 1947 },
  "Dansco|7165": { name: "Franklin Half Dollars 1948–1963", types: ["franklin-half"], start: 1948, end: 1963 },
  "Dansco|7166": { name: "Kennedy Half Dollars 1964 to date", types: ["kennedy-90", "kennedy-40", "kennedy-clad"], start: 1964, end: 0 },
  "Dansco|8166": { name: "Kennedy Half Dollars 1964–2011, with proofs", types: ["kennedy-90", "kennedy-40", "kennedy-clad"], start: 1964, end: 2011, proofs: "all" },
  "Dansco|7175": { name: "Peace Dollars 1921–1935", types: ["peace-dollar"], start: 1921, end: 1935 },
  "Dansco|7176": { name: "Eisenhower Dollars 1971–1978", types: ["ike-clad", "ike-40"], start: 1971, end: 1978 },
  "Dansco|7178": { name: "Morgan Dollars 1878–1890", types: ["morgan-dollar"], start: 1878, end: 1890 },
  "Dansco|7179": { name: "Morgan Dollars 1891–1921", types: ["morgan-dollar"], start: 1891, end: 1921 },
  // Littleton Coin Company albums (numbers from retailer listings; "LCA" is part of the number)
  "Littleton|LCA24": { name: "Flying Eagle and Indian Head Cents 1856–1909", types: ["flying-eagle-cent", "indian-cent"], start: 1856, end: 1909 },
  "Littleton|LCA1": { name: "Lincoln Cents Vol. 1, 1909–1958", types: ["lincoln-wheat"], start: 1909, end: 1958 },
  "Littleton|LCA19": { name: "Lincoln Cents Vol. 2, 1959–2011", types: ["lincoln-memorial-copper", "lincoln-memorial-zinc", "lincoln-bicentennial", "lincoln-shield"], start: 1959, end: 2011 },
  "Littleton|LCA76": { name: "Lincoln Cents Vol. 3, 2012 to date", types: ["lincoln-shield"], start: 2012, end: 0 },
  "Littleton|LCA23": { name: "Liberty Head Nickels 1883–1912", types: ["liberty-nickel"], start: 1883, end: 1912 },
  "Littleton|LCA29": { name: "Jefferson Nickels Vol. 2, 1976–2006", types: ["jefferson-nickel"], start: 1976, end: 2006 },
  "Littleton|LCA3": { name: "Roosevelt Dimes 1946–2012", types: ["roosevelt-silver", "roosevelt-clad"], start: 1946, end: 2012 },
  "Littleton|LCA77": { name: "Roosevelt Dimes Vol. 2, 2013 to date", types: ["roosevelt-clad"], start: 2013, end: 0 },
  "Littleton|LCA26": { name: "Barber Quarters 1892–1916", types: ["barber-quarter"], start: 1892, end: 1916 },
  "Littleton|LCA57": { name: "Standing Liberty Quarters 1916–1930", types: ["standing-liberty-quarter"], start: 1916, end: 1930 },
  "Littleton|LCA4": { name: "Washington Quarters Vol. 1, 1932–1967", types: ["washington-silver", "washington-clad"], start: 1932, end: 1967 },
  "Littleton|LCA15": { name: "Washington Quarters Vol. 2, 1968–1998", types: ["washington-clad"], start: 1968, end: 1998, proofs: "s" },
  "Littleton|LCA15A": { name: "Washington Quarters Vol. 2, 1968–1998", types: ["washington-clad"], start: 1968, end: 1998, proofs: "s" },
  "Littleton|LCA48": { name: "50 State Quarters 1999–2008 (P and D)", types: ["state-quarter"], start: 1999, end: 2008 },
  "Littleton|LCA17": { name: "State Quarters with Proofs 1999–2003", types: ["state-quarter"], start: 1999, end: 2003, proofs: "s" },
  "Littleton|LCA18": { name: "State Quarters with Proofs 2004–2008", types: ["state-quarter"], start: 2004, end: 2008, proofs: "s" },
  "Littleton|LCA18T": { name: "State Quarters with Proofs 2004–2008", types: ["state-quarter"], start: 2004, end: 2008, proofs: "s" },
  "Littleton|LCA75": { name: "America the Beautiful Quarters Vol. 2, 2016–2021", types: ["atb-quarter"], start: 2016, end: 2021, proofs: "s" },
  "Littleton|LCA85": { name: "American Women Quarters 2022–2025", types: ["women-quarter"], start: 2022, end: 2025, proofs: "s" },
  "Littleton|LCA5": { name: "Walking Liberty Half Dollars 1916–1947", types: ["walking-liberty-half"], start: 1916, end: 1947 },
  "Littleton|LCA6": { name: "Franklin Half Dollars 1948–1963", types: ["franklin-half"], start: 1948, end: 1963, proofs: "all" },
  "Littleton|LCA49": { name: "Kennedy Half Dollars 1964–1987", types: ["kennedy-90", "kennedy-40", "kennedy-clad"], start: 1964, end: 1987, proofs: "all" },
  "Littleton|LCA50": { name: "Kennedy Half Dollars 1988–2004", types: ["kennedy-clad"], start: 1988, end: 2004 },
  "Littleton|LCA68": { name: "Kennedy Half Dollars 2005 to date", types: ["kennedy-clad"], start: 2005, end: 0 },
  "Littleton|LCA8": { name: "Morgan Dollars Vol. 1, 1878–1891", types: ["morgan-dollar"], start: 1878, end: 1891 },
  "Littleton|LCA9": { name: "Morgan Dollars Vol. 2, 1892–1921", types: ["morgan-dollar"], start: 1892, end: 1921 },
  "Littleton|LCA10": { name: "Peace Dollars 1921–1935", types: ["peace-dollar"], start: 1921, end: 1935 },
  "Littleton|LCA11": { name: "Eisenhower Dollars 1971–1978", types: ["ike-clad", "ike-40"], start: 1971, end: 1978, proofs: "all" },
  "Littleton|LCA12": { name: "Susan B. Anthony Dollars", types: ["sba-dollar"], start: 1979, end: 1999 },
  "Littleton|LCA59": { name: "Sacagawea Dollars 2000 to date", types: ["sacagawea-dollar"], start: 2000, end: 0 },
  // H.E. Harris folders
  "H.E. Harris|2672": { name: "Lincoln Cents #1, 1909–1940", types: ["lincoln-wheat"], start: 1909, end: 1940 },
};

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
