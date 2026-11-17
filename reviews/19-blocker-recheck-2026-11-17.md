# Blocker re-check before charging (2026-11-17, v0.77.1)

Docs only. Read from the code and the tests; nothing was changed in the app or in how coins are saved. CI on `main` (test, build, deploy) was green at the merge of #262. Nothing was tried on a phone.

## Verdict

Three of four are OK. **One PROBLEM: the license / free public copy (4).** It is a business decision, not a code fix, and it must be settled before charging.

| # | Check | Result |
|---|---|---|
| 1 | Inherited-coin protection | **OK** |
| 2 | Backup/export and restore | **OK** |
| 3 | Value consistent across screens | **OK** (one tiny exception) |
| 4 | LICENSE and public Pages copy | **PROBLEM** |

## 1. Inherited-coin protection: OK
- `isInherited` (values.js) is checked at every selling or moving path: For sale (coinsave.js), Business (seller.js), dealer case (filters.js, dealer.js), grouped orders (order.js), bulk source change (filters.js), CSV import (sheets.js skips For sale), reports (inherited sales left out).
- Mark as sold exists only if the coin has the "sell eventually" note, and then asks first (actions.js). Changing Source away from Inherited asks first (inherit.js `inhLeaveAsk`). `tests/inheritguard.js` and `tests/inherit93b.js` cover these.
- Honest limits: the protection is "asks first", not a hard lock. It keys off the Source word "Inherited". A restore replaces a coin with the backup's copy without an inherited check (it does warn).
- **Test by hand:** (a) on an inherited coin, try Mark as sold, For sale and Move to Business: all should refuse or ask. (b) Edit Source to another word: it should ask "No longer inherited?"; tap Keep Inherited. (c) Select several coins incl. an inherited one, Change source: inherited is skipped and listed.

## 2. Backup/export and restore: OK
- backup.js writes one file with every record (coins, albums, want lists, settings incl. inheritances, value history, price list) plus photos, with `dataVersion` and counts. Skipped photos are counted and warned about.
- Restore refuses non-backup files and newer-version files, shows what it will replace before acting, never deletes, merges settings, history and inheritances, keeps the newer price list, and renumbers clashing coin IDs. Tests: back.js, oldbackup.js, backup-skipped.js, restoresettings.js, data-version.js, valuefrom84.js.
- Honest limits: the file lands where the phone's Save puts it (a one-time habit to build); a restore of an OLD backup replaces newer edits to the same coins (warned in the confirm box).
- **Test by hand:** Options > Backup > Save backup file; note coin count and Home total. Open the main link in a private window (empty app), Restore that file: count, total, photos, an inherited coin's "From/History", and the price list should all match.

## 3. Value consistency across screens: OK
- One function, `bestEach` (values.js), feeds Home, coin page, albums, filters, history, reports and CSV; `tests/value86.js` checks coin page = Home, never under face, report Paid = cost.
- Small exception: the "premium over melt" list (views.js ~197) uses `valueEach`, not `bestEach`, so it can differ for a coin lifted to face value. Asking-price suggestions (pricing.js) use `bookPrice` on purpose.
- No prices ship, so a new buyer sees melt/face only until loading their own price file. That is a product point for step 4 below, not a bug.
- **Test by hand:** pick 3 coins (one book-priced, one with your own value, one silver at melt). Compare the number on Home/Value list, the coin page, its album page, and the insurance report. All should match.

## 4. LICENSE and public free copy: PROBLEM
- **There is no LICENSE file.** The repo is **public** (GitHub reports no license) and GitHub Pages serves the full app free to anyone with the link. Nothing in the code gates, limits or asks for payment.
- NOTICE.md says the app is "not a product", "not offered for distribution, resale or use by others". That contradicts charging for it.
- NOTICE.md also says prices come from his own printed Red Book copy for his own use. Selling an app built around Red Book dates/varieties is a rights question for him to settle.
- Decide before charging: (a) make the repo private and move the paid app to a separate hosted copy/store; (b) keep it public with a real LICENSE that fits a paid app; (c) free forever. A real answer on the Red Book catalog facts is also needed. Not legal advice; a short lawyer or Whitman check is worth it.
- **Test by hand:** open https://waddelljmw.github.io/CoinShelfTest/ in a private window and confirm that anyone can add coins with no payment step. Open the repo link while logged out to confirm the source is visible.
