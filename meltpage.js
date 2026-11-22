/* Step 18 (idea 113): the Melt table. A page of common silver coins with today's melt at the silver price from Home / Options.
   Nothing is saved. Only coins whose silver weight the app already knows (the catalog's standard 90%, 40% and 35% weights) are listed; others are left off. */
const MELT_GROUPS = [
  ["Dimes", ["barber-dime", "mercury-dime", "roosevelt-silver"]],
  ["Quarters", ["barber-quarter", "standing-liberty-quarter", "washington-silver"]],
  ["Half dollars", ["barber-half", "walking-liberty-half", "franklin-half", "kennedy-90", "kennedy-40"]],
  ["Dollars", ["morgan-dollar", "peace-dollar", "ike-40"]],
  ["Nickels", ["jefferson-war-nickel"]],
];
// The silver share, read from the catalog weight (so it can never disagree with it): the app's 90%, 40% and 35% weights.
function meltPercent(t) {
  if ([AG.dime, AG.quarter, AG.half, AG.dollar].includes(t.oz)) return "90%";
  if ([AG.half40, AG.ike40].includes(t.oz)) return "40%";
  if (t.oz === AG.warNickel) return "35%";
  return "";
}
function meltRows() {
  return MELT_GROUPS.map(([label, ids]) => ({
    label,
    rows: ids.map((id) => TYPE_BY_ID[id]).filter((t) => t && t.melt === "silver" && t.oz > 0 && meltPercent(t)),
  })).filter((g) => g.rows.length);
}
function viewMelt() {
  const spot = spotPerOz("silver");
  const groups = meltRows();
  const yrs = (t) => (t.start === t.end ? "" + t.start : t.start + "–" + t.end);
  const body = groups.map((g) => `<h2>${esc(g.label)}</h2><div class="card">${g.rows.map((t) => `<div class="rowline"><span>${esc(t.name)}<div class="small muted">${esc(yrs(t))} · ${meltPercent(t)} silver · ${t.oz.toFixed(4)} oz</div></span><span class="num">${spot == null ? `<span class="muted small">no price</span>` : money(t.oz * spot, "$0.00")}</span></div>`).join("")}</div>`).join("");
  return `<button class="link-btn" data-go="home">← My Cabinet</button>
    <h1>Melt table</h1>
    <div class="card small">${spot == null
      ? `Set the silver price first: <button class="link-btn" data-go="options">Options › Spot prices</button>.`
      : `Melt for one coin at silver <b>${money(spot, "$0.00")}</b> per ounce (the price on Home). Change it in <button class="link-btn" data-go="options">Options</button>.`}
      <div class="muted" style="margin-top:4px">Melt = pure silver ounces × the price. It is what the metal is worth, not what a collector pays. Only coins whose silver weight the app knows are listed.</div></div>
    ${body}`;
}
