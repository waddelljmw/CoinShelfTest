# Bug review: Coin Cabinet v0.58.0 (Sat 2026-11-07, Opus)

Read-only review of the backup zip `coinshelftest-backup-2026-11-06b`. Nothing was built or changed. All 107 automatic tests pass. The zip has no old history, so "recent work" means pocket albums (v0.56), the Lincoln S proofs (v0.56.2) and the Red Book modern / Mercury dime work (#164). I went deep on those, plus backup/restore (the top data risk) and the bugs he already reported. Everything else got a light pass.

**For Tuesday's Claude:** ✔ = reproduced in a real browser test; 📖 = confirmed by reading the code. Line numbers refer to v0.58.0.

## Fix first (these stop him entering coins or can lose data)

### 1. ✔ Add coin is lost if the phone closes the app (his "form vanishes after a photo" bug)
- **What happens:** the half-filled Add coin form exists only in the app's memory. Nothing is saved until he taps Save. When he taps Add photos, Android often closes the app in the background to free memory for the camera. When it reopens, the form, the year, the mint and the album spot ("pin") are all gone.
- **Test:** I started a 1881-S Morgan, added a photo, then reloaded the page (the same thing Android does). Result: no form, no coin, and the photo was left on the phone with no coin attached. The app deletes that loose photo after a day, so it doesn't pile up.
- **Cause:** `coinform.js:3` `let draft = null`. Nothing is written to `sessionStorage`. The add form has no page address of its own (`location.hash` stays `''`).
- **Smallest safe fix (S):** whenever the form changes, also save `draft` to `sessionStorage`. That includes after `addPhotos` (`coinsave.js:164-183`). When the app starts and finds a saved draft, reopen the form ("Picking up the coin you were adding"). Clear it on Save or Cancel. Photo ids (`lid`) are already on the device, so they come back too. This doesn't change how saved coins are stored.
- **Test to add:** fill the form, add a photo, reload, and check that the form comes back with the photo and the album spot.

### 2. ✔ Restoring a backup onto a new phone or new web address loses his Home layout
- **Why it matters now:** if the app moves off GitHub, the new address starts empty and his coins come back only through Restore.
- **What happens:** a brand-new app saves a full set of default settings the moment it opens (it records `seenVersion`). During a restore, `mergeRestored` (`backup.js:91-104`) keeps "this device's" value for every setting that isn't blank. Empty `{}` objects and `false` count as not blank, so the new phone's defaults win.
- **Test:** old phone had a Safe-style shelf, a custom shelf order/pins/hidden shelves, and Hide values on. I restored onto a fresh app. After the restore all of those were back to defaults. Coins, albums, the ID style and pricing restored fine.
- **Also lost the same way:** folded Home sections, Show sold, the Home section switches, hidden metal prices.
- **Fix (S):** treat a setting as "set on this device" only when it differs from `DEFAULT_SETTINGS`. Simpler still: if this device has no coins, let the backup's settings win.
- **Test to add:** fresh app, restore, check that `shelfStyle` and `shelfLayout` came back.

### 3. 📖 Backups can silently leave out photos
- **What happens:** `collectPhotos` (`backup.js:12-23`) skips any photo it can't read and says nothing ("a missing photo doesn't stop the backup"). The success message only shows how many photos it did save. So a backup can be missing photos and he wouldn't know until he restored it.
- **Fix (S):** count the skipped photos and say "N photos couldn't be added" in the backup message.
- **Real-phone test still needed** (consultant note): back up on the phone, restore into a private window, and check the photos. Backup/restore has never been tried for real.

## Already reported by him (cause found)

### 4. 📖 Box totals ignore albums kept in the box (his "0 vs 4" and "Waterford Crystal 3 vs 4")
- **Cause:** a box's number is `boxStats` (`boxes.js:151`), which counts only coins (`boxCoins`). Albums and pocket albums kept in the box (`keptAlbums` / `keptPockets`, `boxes.js:382-383`) show inside the box but never in its number. So a box holding 4 albums and no loose coins shows "0 items" on Storage.
- **Fix (S):** show the albums as their own number, e.g. "3 coins · 1 album". Don't add the two together, so the slot count (filled/total) stays correct.
- **Needs his screenshot:** if his "0" was on the **My Albums** page and not on Storage, that's a different cause. The pocket-album card there uses the same counter as its own page, so I couldn't make them disagree.

### 5. 📖 A pocket album page says "← Storage", but pocket albums aren't on Storage
- **What happens:** `viewBox` (`boxes.js:204`) always shows "← Storage". The missing-box message (`boxes.js:177`) says "Back to Storage". Deleting a pocket album sends him to Storage (`boxes.js:341`). But Storage leaves pocket albums out (`boxes.js:160`), and they live on **My Albums**.
- **Fix (S):** for `type === "pocket"`, the back link and the after-delete page should go to "albums" ("← My Albums").

## Smaller things

6. 📖 **README says his coins are saved to his Claude account.** Wrong for the phone app. They are in Chrome's on-phone storage at the github.io address. Clearing Chrome's site data, or uninstalling the home-screen app, deletes them. Fix the wording (S). This matters for the host move: a new address = an empty app until he restores.
7. 📖 **PLAN.md is behind the code.** The "Next session starts here" line mentions v0.56.2, but the app is v0.58.0 (PRs up to #164). The Tuesday start check should update it before planning.
8. 📖 **No "What's new" for 0.57 or 0.58** (`whatsnew.js` stops at 0.56.0). If 0.57/0.58 were features (the middle number changed), he saw no note. Add one line, e.g. the Mercury dime Red Book values.
9. 📖 **The backup's "N albums" count leaves out pocket albums** (`backup.js:30`, and the restore question at line ~120). Cosmetic.
10. 📖 **Red Book prices are still in public files.** `catalog/pricebook.js` and `catalog/pricebook-modern.js` are served at the public address. #164 (Mercury dimes) added more. He marked keeping them out of public code a top priority (11/06). Decide where they live before more Red Book data goes in, and before moving to a new host.

## Checked, no problem found
- **Pocket albums:** they can't be shrunk below where coins sit; deleting one keeps its coins (with Undo); "next free pocket", pages and spine color all work.
- **Coin ids:** they never repeat after a restore (`idOwner` check).
- **Leftover photos:** they are cleaned up only after a day, so a form open in another window keeps its photo.
- **App updates:** an update never reloads the app while a form is open.
- **Offline copy:** it opens from the phone's saved copy first. So if the github.io site went down, the installed app should keep opening, as long as nobody clears its data. Not tested on a real phone.
- **Red Book modern / Mercury FB / Lincoln S proofs:** tests pass. The values themselves can't be checked without the book.

## Suggested order for Tuesday
1 → 4 → 5 → 2 → 3 as one small Sonnet update. #1 is an entry blocker; #2 must be done before any restore at a new address. Add 6–8 while in those files. Then do #10 as part of the host move.
