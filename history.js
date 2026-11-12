// Collection value over time: one point per day, kept in a single "history" document,
// and a small chart for Home. Loaded after app.js.
"use strict";

const HISTORY_KEEP_DAYS = 1100; // about three years
let historyTimer = null;
const historyView = { range: "90" }; // 30 | 90 | 365 | all

function currentTotals() {
  const owned = ownedCoins().filter((c) => !c.biz); // Business stock is counted apart
  return {
    v: Math.round(sum(owned, (c) => (bestEach(c) || 0) * qtyOf(c)) * 100) / 100,
    m: Math.round(sum(owned, (c) => (meltEach(c) || 0) * qtyOf(c)) * 100) / 100,
    n: sum(owned, qtyOf),
  };
}
const historyDays = () => ((store.docs.get("history") || {}).days || {});

// Save today's totals if they changed. Called a moment after any change, and on load.
function recordHistory() {
  if (store.mode === "snapshot" || store.mode === "loading" || store.mode === "demo") return;
  const t = currentTotals();
  const days = { ...historyDays() };
  const key = today();
  const prev = days[key];
  if (prev && prev.v === t.v && prev.m === t.m && prev.n === t.n) return; // nothing new
  if (!prev && t.n === 0 && !Object.keys(days).length) return; // empty cabinet, nothing to chart yet
  days[key] = t;
  const keys = Object.keys(days).sort();
  keys.slice(0, Math.max(0, keys.length - HISTORY_KEEP_DAYS)).forEach((k) => delete days[k]);
  put("history", { kind: "history", days });
}
function scheduleHistory() {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(recordHistory, 1500);
}

function historyPoints() {
  const days = historyDays();
  let keys = Object.keys(days).sort();
  if (historyView.range !== "all") {
    const from = localDate(new Date(Date.now() - (+historyView.range) * 86400000));
    keys = keys.filter((k) => k >= from);
  }
  return keys.map((k) => ({ d: k, ...days[k] }));
}

const shortDate = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
const compactMoney = (n) => (Math.abs(n) >= 10000 ? "$" + Math.round(n / 1000) + "k" : Math.abs(n) >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + Math.round(n));

function historyChartSvg(pts) {
  const W = 320, H = 130, L = 40, R = 8, T = 10, B = 22;
  const t0 = new Date(pts[0].d).getTime(), t1 = new Date(pts[pts.length - 1].d).getTime();
  const span = Math.max(1, t1 - t0);
  const maxV = Math.max(...pts.map((p) => Math.max(p.v, p.m)));
  const minV = Math.min(...pts.map((p) => Math.min(p.v, p.m)));
  const pad = (maxV - minV) * 0.1 || maxV * 0.1 || 1;
  const lo = Math.max(0, minV - pad), hi = maxV + pad;
  const x = (p) => L + ((new Date(p.d).getTime() - t0) / span) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = (key) => pts.map((p, i) => (i ? "L" : "M") + x(p).toFixed(1) + " " + y(p[key]).toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Collection value and melt value over time" style="display:block;overflow:visible">
    <line x1="${L}" x2="${W - R}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--line)"/>
    <line x1="${L}" x2="${W - R}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--line)"/>
    <text x="${L - 6}" y="${y(hi) + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${compactMoney(hi)}</text>
    <text x="${L - 6}" y="${y(lo) + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${compactMoney(lo)}</text>
    <text x="${L}" y="${H - 4}" font-size="12" fill="var(--muted)">${shortDate(pts[0].d)}</text>
    <text x="${W - R}" y="${H - 4}" text-anchor="end" font-size="12" fill="var(--muted)">${shortDate(last.d)}</text>
    <path d="${line("m")}" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="4 3"/>
    <path d="${line("v")}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="${x(last)}" cy="${y(last.v)}" r="3.5" fill="var(--accent)"/>
  </svg>`;
}

// Card for Home.
function historyCard() {
  const all = Object.keys(historyDays());
  const ranges = [["30", "30 days"], ["90", "90 days"], ["365", "1 year"], ["all", "All"]];
  let body;
  if (all.length < 2) {
    body = `<div class="small muted">Your chart starts today. A point is saved each day you open the app, so check back tomorrow to see a line.</div>`;
  } else {
    const pts = historyPoints();
    if (pts.length < 2) {
      body = `<div class="small muted">Not enough days in this range yet. Try a longer one.</div>`;
    } else {
      const a = pts[0], z = pts[pts.length - 1];
      const ch = z.v - a.v, chp = a.v ? ch / a.v : null;
      body = `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px">
          <span class="small muted">Since ${esc(shortDate(a.d))}</span>
          <span class="num ${signCls(ch)}" style="font-weight:700">${ch >= 0 ? "+" : "−"}${money(Math.abs(ch))}${chp == null ? "" : " (" + pct(chp) + ")"}</span>
        </div>
        ${historyChartSvg(pts)}
        <div class="small muted" style="display:flex;gap:14px;margin-top:6px">
          <span><span style="display:inline-block;width:14px;height:3px;background:var(--accent);vertical-align:middle;border-radius:2px"></span> Value</span>
          <span><span style="display:inline-block;width:14px;border-top:2px dashed var(--muted);vertical-align:middle"></span> Melt</span>
        </div>`;
    }
  }
  return homeSection("history", "Value over time", `<div class="card">
      ${all.length >= 2 ? `<div class="chips" style="margin:-2px 0 10px">${ranges.map(([k, l]) => `<button class="chip ${historyView.range === k ? "on" : ""}" data-act="histRange" data-v="${k}">${l}</button>`).join("")}</div>` : ""}
      ${body}
    </div>`);
}

Object.assign(actions, {
  histRange: (el) => { historyView.range = el.dataset.v; render(); },
});
