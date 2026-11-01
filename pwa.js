// Installing Coin Cabinet on the phone and keeping it up to date (only when it runs on its own website).
"use strict";

function showUpdateBar(worker) {
  if (document.getElementById("updateBar")) return;
  const last = settings().lastBackup;
  const days = last ? Math.floor((Date.now() - new Date(last + "T12:00:00").getTime()) / 86400000) : Infinity;
  const bar = document.createElement("div");
  bar.id = "updateBar";
  bar.className = "update-bar";
  bar.innerHTML = `<span>A new version of Coin Cabinet is ready.${allCoins().length && days > 7 ? ` <button class="link-btn" data-act="openBackup">Save a backup first</button>` : ""}</span>
    <button class="btn primary" id="updateNow">Update now</button>`;
  document.body.appendChild(bar);
  bar.querySelector("#updateNow").addEventListener("click", () => { bar.querySelector("#updateNow").disabled = true; worker.postMessage("update-now"); });
}

function initPwa() {
  if (!("serviceWorker" in navigator) || window.claude || window.COIN_SNAPSHOT) return;
  if (!/^https:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  let reloading = false;
  const hadController = !!navigator.serviceWorker.controller;
  // When the new version takes over, reload once so the page uses it.
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !reloading) { reloading = true; location.reload(); } });
  navigator.serviceWorker.register("sw.js").then((reg) => {
    const watch = (w) => w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) showUpdateBar(w); });
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg.waiting);
    watch(reg.installing);
    reg.addEventListener("updatefound", () => watch(reg.installing));
    // Check for a new version when the app is opened again.
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
  }).catch(() => { /* works fine without; just no offline copy */ });
}
initPwa();
