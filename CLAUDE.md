# Working on Coin Cabinet

Read this, then only the **next unchecked step** in `PLAN.md` (don't read the whole plan).

## The person
- Coin collector, **no app-building background**. Plain words.
- **Token-conscious.** Short replies (aim for under 150 words). No recaps of steps already shown. Don't repeat merge/branch instructions he already knows beyond the two links.
- **Say which model to use before each next step.** Opus: planning, reviews, anything that reshapes stored data. Sonnet: building, routine fixes, data entry (album lists, coin dates).

## Doing a change (keep it cheap)
1. Branch from `main`. Batch related small requests into one branch/PR.
2. Find code with `grep -n` and read only the lines needed. Don't read whole files (`app.js` is ~2,000 lines).
3. Plain files only: no build step, no frameworks.
4. Add/adjust a test in `tests/`. Run **`node tests/run-all.js 2>&1 | tail -3`**; only look at details if something fails. Screenshots only for new layouts.
5. Raise the version in **three places**: `APP_VERSION` (app.js), `version` (package.json), `CACHE` (sw.js). Fix → last number; feature → middle. New page files must be added to `FILES` in sw.js.
6. Commit, push, open a PR with `gh api` (GraphQL is blocked).
7. On **"merge it"**: `gh api -X PUT repos/waddelljmw/CoinShelfTest/pulls/<n>/merge -f merge_method=merge -f sha=<HEAD>`, confirm `main` has it, tick `PLAN.md`, give **https://github.com/waddelljmw/CoinShelfTest/branches**. Remind him to tap **Update now** on the phone.
8. Merging publishes the real app at **https://waddelljmw.github.io/CoinShelfTest/**. The Claude artifact (slug `11b5b1eb-a5c1-4157-8b05-2c9cda610e1f`) is only a test copy; don't publish there unless asked.

## Reviews (the most expensive thing; ~100–150k tokens each)
- One Opus adversarial subagent **per phase**, and before changes that reshape stored data. Not after every small feature.
- Point it at the changed files and the risks; ask for reproduced problems only, under 600 words.

## Things that don't work from here (don't retry)
- Deleting branches, the GitHub Pages API, GraphQL: blocked. Opening github.io or most websites from the shell: blocked (check Pages with `gh api repos/waddelljmw/CoinShelfTest/deployments`).
- littletoncoin.com can't be read; use retailer listings or ask for screenshots.

## Code map
- Scripts load in this order (index.html): `catalog/data.js`, `catalog/pricebook.js`, `catalog/albums.js`, `app.js`, `sheets.js`, `photofill.js`, `history.js`, `wants.js`, `report.js`, `snapshot.js`, `albumdb.js`, `local.js`, `backup.js`, `pwa.js`.
- `catalog/`: coin knowledge, swappable for another collection. `data.js` types, metals, grades, `EXACT_SLOTS` dates/mints, designs (`varieties`); `pricebook.js` Red Book values, mintages, proof dates; `albums.js` album lookup (`ALBUM_DB`).
- `app.js`: storage (`put`, `remove`, `store.mode`), coin form (`renderCoinForm`, `saveDraft`, `pickType`), values (`bookLookup`, `meltEach`), dates (`today`, `yearProblem`), albums (`buildAlbumSlots`, `albumStats`, `slotType`, series/reorder), Options (`viewOptions`), actions (`actions` object).
- `wants.js` want lists and album-spot menus · `sheets.js` CSV · `photofill.js` read coin from photo · `history.js` value over time · `report.js` insurance report · `snapshot.js` view-only file · `albumdb.js` album lookup forms · `local.js` on-device storage (IndexedDB) · `backup.js` Backup/Restore · `pwa.js` + `sw.js` + `manifest.webmanifest` install, offline, update bar.
- `store.mode`: `local` phone app · `db` Claude account · `snapshot` · `memory`. Photos: `{lid}` on device, `{id}` Claude, `{url}` temporary.
- Record keys: `c_` coins, `a_` albums, `w_` wants, `wl_` want lists, `settings`, `history`.

## Rules that protect his coins
- Never delete data without asking; offer Undo.
- Old saved data must keep working: convert on read.
- A saved coin's type never changes. Coin years must be real (`yearProblem`).
- Don't guess coin facts (dates, mints, mintages, album contents): look them up or ask for Red Book pages / photos.
