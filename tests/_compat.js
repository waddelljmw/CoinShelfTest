// Shared by the older tests. Since Step 2.3 the Add coin page starts with "What is it?" and keeps most
// fields in closed sections. This makes every test page click "US coin" and open all sections on its own,
// so the older tests can keep filling in fields directly. (tests/step23.js tests the real behaviour.)
const { chromium } = require("playwright");
const launch = chromium.launch.bind(chromium);
const script = () => {
  const go = () => {
    document.querySelectorAll(".what-btn[data-v=us]").forEach((b) => b.click());
    document.querySelectorAll("#coinForm details[data-sec]:not([open])").forEach((d) => { d.open = true; });
  };
  document.addEventListener("DOMContentLoaded", () => new MutationObserver(go).observe(document.body, { childList: true, subtree: true }));
};
chromium.launch = async (...a) => {
  const b = await launch(...a);
  const np = b.newPage.bind(b);
  b.newPage = async (...x) => { const p = await np(...x); await p.addInitScript(script); return p; };
  const nc = b.newContext.bind(b);
  b.newContext = async (...x) => { const c = await nc(...x); await c.addInitScript(script); return c; };
  return b;
};
module.exports = { chromium };
