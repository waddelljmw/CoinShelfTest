# Working on Coin Cabinet

Read this first, then `PLAN.md` for what's next.

## The person you're working with
- A coin collector with **no app-building or AI background**. Explain things in plain words.
- Wants **short replies** to save tokens.
- Switches between Sonnet 5.5 and Opus 5.5. **Say which model to use before each next step** (Opus for planning, reviews and data-storage changes; Sonnet for building and routine fixes).

## How each change is done
1. Make a branch from `main`.
2. Make the change. Keep the app as plain files: no build step, no frameworks.
3. Add or update a test in `tests/`, then run **`node tests/run-all.js`**. Everything must pass. Tests use Playwright on a phone-sized screen; a test fails if it prints `FAIL`, crashes or reports page errors.
4. Raise `APP_VERSION` in `app.js` and `version` in `package.json` (small fix: last number; new feature: middle number).
5. Publish the changed files to the Claude artifact (until Step 1.2 moves hosting to GitHub Pages): slug `11b5b1eb-a5c1-4157-8b05-2c9cda610e1f`. Get the current version with get_artifact first.
6. Commit, push and open a pull request (use `gh api`, since GraphQL is blocked).
7. When the user says **"merge it"**: merge with `gh api -X PUT repos/waddelljmw/CoinShelfTest/pulls/<n>/merge -f merge_method=merge -f sha=<latest commit>`, so it only merges what was tested. Then check `main` has that commit.
8. After merging, give the link **https://github.com/waddelljmw/CoinShelfTest/branches** so the user can delete the branch (deleting branches from here is blocked).
9. Tick the step in `PLAN.md`.

## Before risky work
- Run one adversarial review (an Opus subagent) after each phase, and before anything that moves or reshapes stored data.

## How the code is laid out
- `index.html`: page shell. Scripts load in this order: `catalog/data.js`, `catalog/pricebook.js`, `catalog/albums.js`, `app.js`, `sheets.js`, `photofill.js`, `history.js`, `wants.js`, `report.js`, `snapshot.js`, `albumdb.js`, `local.js`, `backup.js`.
- `catalog/`: what the app knows about coins. Swap this folder for a different collection (e.g. ancient coins).
  - `data.js`: coin types, metal content, grades, exact dates and mint marks (`EXACT_SLOTS`), designs and varieties.
  - `pricebook.js`: Red Book values, mintages and proof dates (typed in from the user's Red Book photos).
  - `albums.js`: the album lookup list (brand + number → types, years, proofs).
- `app.js`: storage, coins, albums, forms, values. `wants.js`: want lists. `sheets.js`: CSV import and export. `photofill.js`: reading a coin from a photo. `history.js`: value over time. `report.js`: insurance report. `snapshot.js`: view-only share file. `albumdb.js`: album lookup on the album forms. `local.js`: saving on the device (IndexedDB) when the app runs outside Claude. `backup.js`: Backup and Restore.
- Where coins are saved (`store.mode`): `local` = on the device (outside Claude), `db` = the user's Claude account, `snapshot` = view-only share file, `memory` = nothing saved.
- Photos: `{lid}` = on the device, `{id}` = stored by Claude, `{url}` = temporary.
- Saved records are kept by key: `c_<id>` coins, `a_<id>` albums, `w_<id>` wants, `wl_<id>` want lists, `settings`, `history`.

## Rules that protect the user's coins
- Never delete data without asking first; offer Undo where possible.
- Older saved data must keep working: convert it when it's read, never break it.
- A saved coin's type never changes.
- Don't guess coin facts (dates, mint marks, mintages). Look them up or ask for Red Book pages.
