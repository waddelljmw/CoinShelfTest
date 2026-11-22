# R5 Album filler (Whitman / Dansco): report (app v0.77.2, Tue 2026-11-17)

Report only. No app code, saved data, PLAN.md or IDEAS.md was changed. Two Opus agents ran the app at phone size (390x844, touch, empty storage) on copies of the repo. A: everyday album filling tap by tap. B: bulk Fill spots and awkward cases. Both were given reviews/23 (R4's 61 ranked fixes), reviews 20 to 22, IDEAS 99 to 116 and the "already done / rejected" lists as known, and told to report only new findings. I merged, de-duplicated and spot-checked the code on the claims that disagreed.

**Tags.** Sev: **A** wrong data goes in · **B** data hidden or lost · **C** confusing or extra work. Size S/M/L as in R4 (L = changes how saved data is stored). Evidence: VERIFIED-run (an agent reproduced it) · VERIFIED-code (code read, file:line) · VERIFIED-web · GUESS.

## Verdict
- **Filling spots one at a time works** and keeps your place on the page. It is **5 taps a coin with just a grade, 10 with price and photo** (100 taps for 10 coins). Fill spots is about 2 taps a coin.
- **The album's Missing list is never crossed off** when coins arrive through Fill spots or "Put a coin I already have here". Both agents hit it on their own. This is the same family as R4 rank 1 and should be fixed with it.
- **Coins quietly fall out of their spots** in four ways: hiding a spot, changing the album's years, a CSV round trip, and fixing a coin's variety. Nothing asks first.
- **Two spot-data gaps:** the 1895 Philadelphia Morgan spot looks like a normal spot but the app's own Red Book facts list 1895 only as a proof; and "+ Add a spot" accepts dates the series never had.
- **The upgrade path stops halfway:** the want is offered for most grades, but when the better coin arrives it does not take the old coin's spot.

## New findings, ranked (worst first)

| ID | Sev | Size | What I did (taps) | What happened | What I expected | Where I expected it | Evidence |
|---|---|---|---|---|---|---|---|
| **R5-1** (A-AF2, B-BF1) | A | S | Make the album's Missing want list (2 taps, 49 to 54 coins). Then Fill spots, tick 3, Save. Also: a loose coin into a spot with "Put a coin I already have here". | List still shows every coin; filled spots show their grade **and "★ wanted"**. Album says Missing 46 to 51, list says 49 to 54. Risk: buying a duplicate. | Filled spots come off this album's list, as with Add coin to this spot. | Fill spots Save; the list | VERIFIED-run (both agents). Code: only the Add form path removes wants (`coinsave.js:134,149`); `fillalbum.js:100-126` and `wants.js:493-507` never touch wants. |
| **R5-2** (B-BF2) | A | S | Whitman 9129, spot 1895, Add coin to this spot, VF-20, Add. | The spot menu says only "1895 Morgan Dollar $1". A circulated 1895 saves with no warning and is valued at face ($1.00). | Spot labelled "Proof only", or a warning on a circulated grade. | The 1895 spot menu; grade box | VERIFIED-run + code: `catalog/bookfacts.js:7` lists 1895 (Philadelphia) only as a proof; `catalog/data.js:154` gives it a normal spot. |
| **R5-3** (B-BF3) | A | S | Morgan album, + Add a spot, 1922 / 1880 D / 1950 S. | All three say "Spot added". Album total goes 54 to 57, so it can never show complete, and the spot builds an impossible coin. | "Morgan dollars weren't struck at Denver in 1880." | Add a spot sheet | VERIFIED-run. `albums.js:341-347` checks the year range only for albums with more than one coin type; mints per `catalog/data.js:150-157`. |
| **R5-4** (A-AF1) | A | S | Coin in the 1878 8 Tail Feathers spot, then View coin, Edit, Variety "7 Tail Feathers", Save. | Coin says 7 TF; album still shows **8 TF filled and 7 TF open**. | Coin moves to the 7 TF spot, or the app asks. | Album grid after the edit | VERIFIED-run. `coinsave.js:103` `fitsSpot` checks date, mint and proof, not variety. |
| **R5-5** (A-AF5, B-BF5, part B-BF4) | B | S | (a) Edit spots, tap a filled spot, Hide spot (or Remove spot on a custom one). (b) Edit album, shorten the years, Save. | One tap, no question, no Undo on Hide. The coins slide into "Also in this album". Page reads Owned 0/53 while Album value is unchanged. | "This spot holds your 1879 VF-30. Hide it anyway?" and "4 coins will lose their spot". | Hide spot / Edit album Save | VERIFIED-run (both). `albums.js:270-274`, `actions.js:181`. |
| **R5-6** (B-BF4, rest) | B | M | Whitman 9128 holding 3 coins in the 1878 variety spots. Edit album, From 1880, Save; then back to 1878, Save. | The 3 variety spots come back as **one plain "1878"**. 2 of 3 coins stay in "Also in this album". | The album's own variety spots return. | Edit album Save | VERIFIED-run. `editforms.js:170` rebuilds the spots without the album's `spotVarieties` (new album passes them at `editforms.js:105`). |
| **R5-7** (A-AF3) | B | M | 1881-S MS-64 in its spot, Want an upgrade, Add (3 taps). Wants, Got it, Save. | The MS-65 lands in "Also in this album". The old coin keeps the spot. Owned 6/54, but Album value jumps $1,253 to $3,626 (both counted). No swap step. | "Put the MS-65 in the 1881-S spot? Old one goes loose / box / sell." | Got it on an Upgrade want; filled spot menu | VERIFIED-run. `albums.js:103-108` the old coin keeps its spot id. |
| **R5-8** (B-BF6) | B | M | 6 album coins incl. 3 in 1878 variety spots and a custom "1880 VAM-6 8/7" spot. Export CSV; on a fresh phone make Whitman 9128, Import CSV. | "Imported 6 rows." Only 2 are in spots. **The VAM-6 coin (XF-40) takes the plain 1880 spot.** | Each coin goes back to its spot, or the toast says "4 coins couldn't find their spot". | Import toast; album page | VERIFIED-run. CSV has an Album column but no spot or spot-variety column (`sheets.js:102-118`). Not F25 (there the album is missing). Backup restore was fine. |
| **R5-9** (B-BF7) | B | S | (1) Edit a coin, tick "Upgrade wanted", Save. (2) Filled spot, Want an upgrade, Add, then My Coins "Upgrade wanted" filter. | The two marks are separate: the coin's tick never shows on the album spot or want list; the spot's want never shows in My Coins and goes to **General**, with the target only one grade up. | One upgrade mark that shows on the spot, in My Coins and on the album's list. | Spot; My Coins filter | VERIFIED-run. `c.upgrade` (`coinform.js:226`, `views.js:69,228`) vs a want record (`wants.js:464-476`). Not idea 100 (that is the "wanted" label). |
| **R5-10** (A-AF6) | C | S | Spots holding coins graded XF-45, AU-58, VF-35, F-15. | No "Want an upgrade" in the spot menu. Missing for PO-1, FR-2, AG-3, G-6, VG-10, F-15, VF-35, XF-45, AU-58 (MS-70 and PR-70 correctly have none). | Upgrade offered (XF-45 to AU-50). | Filled spot menu | VERIFIED-run. `wants.js:444` needs the next grade to share the same 2-letter prefix (agent read; I only saw the return line). |
| **R5-11** (A-AF4) | B | S | Make an inherited "Grandpa" Whitman 9128 beside a regular 9128 and 9129. | Grouped as "Morgan dollar series, 3 albums"; moves together in Reorder. | An inherited album is never auto-linked. | My Albums; Reorder | VERIFIED-run. `app.js:301-317` links consecutive numbers with no inherited check. Not 104 (grouping, not looks). |
| **R5-12** (B-BF9) | C | S | Two Whitman 9128 albums (his own and an inherited copy), both unnamed. | My Albums and the "Kept in" list show "Whitman 9128" twice. CSV import sends every such row into one of the two (last wins). | Ask for a name, or add "(2)". | New album; Kept in list | VERIFIED-run (lists); VERIFIED-code for import (`sheets.js` `albumByName`). 104 covers only an "inherited" label. |
| **R5-13** (B-BF8) | C | S | Whitman 9122, Fill spots, Save coins. | Sheet says a blank grade is fine, then Save is refused one proof spot at a time (22 rows). | Proof rows start unticked, or a blank grade is allowed. | Fill spots sheet | VERIFIED-run. `fillalbum.js:107-108` (in the same family as P1). |
| **R5-14** (A-AF7, AF8, AF12) | C | S | 10 coins into 10 spots, each with price and photo. Also a regrade from the spot. | Every new form starts with all folds closed, so price and photo cost 3 extra taps each coin. Photos sit 3 levels deep. Regrade = 7 taps. | Folds stay open for the next coin; photo near Grade; Edit on the filled spot menu. | Add coin to album sheet; filled spot menu | VERIFIED-run. `coinform.js:86` "new coins start with every section closed". |
| **R5-15** (A-AF13) | C | S | Own 1881-S in album 1; tap the 1881-S spot in album 2. | No "Put a coin I already have here" (coins already in an album are left out). Moving = Take out (4) + Put (3) = 7 taps. | "Move from Whitman 9128" in the list. | Empty spot menu | VERIFIED-run. `wants.js:481-482` `!c.albumId`. |
| **R5-16** (A-AF9) | C | S | Delete album (2 taps) after making its Missing list. | The "Missing from Whitman 9128" list (52 wants) stays, no question; its album tag disappears. | "Also delete its want list (52)?" | Delete album confirm | VERIFIED-run. `actions.js:190-198`. |
| **R5-17** (A-AF11) | C | S | 10 silver Morgans, no silver price yet. | Album page says "Album melt $0.00" while each coin page says "Enter spot price". | "Needs silver price". | Album page stats | VERIFIED-run. `albums.js:132` `meltEach \|\| 0`. |
| **R5-18** (A-AF10) | C | S | Pocket album, 3 pages, 2 Silver Eagles. | No value on the card or page; pockets show only "2001". | Value like regular albums; grade in the pocket. | Pocket card and page | VERIFIED-run. `pockets.js:43-46`. |
| **R5-19** (A-AF14) | C | S | Empty spot, Add to want list. | Hint says "Adds... with no typing", but it opens a picker that needs 2 more taps. | One tap adds to this album's list. | Empty spot menu | VERIFIED-run. |
| **R5-20** (B-BF10) | C | S | Fill spots 2 coins, Undo, add 1 coin. | The new coin gets MD-005; Undo used up MD-003 and MD-004, so the numbers on his flips have a gap. | Undo gives the numbers back. | Coin ID | VERIFIED-run. |
| **R5-21** (B-BF11) | C | S | New album, Dansco 7173. | Not in the album list (falls to the known F20: silently the wrong type). | Lookup finds it. | Album number | **Fact check needed from his Red Book / album.** A retailer lists Dansco #7173 "Silver Morgan Dollars 1878-1893" (VERIFIED-web, listing only). Whether 7174 exists is a **GUESS**. `catalog/albums.js` has only 7178 and 7179 for Morgans. Not added to the app; do not guess contents. |

## Tap counts (the two agents counted slightly differently; both shown)

| Task | Taps | Notes |
|---|---|---|
| (a) Whitman 9128 from an empty app | **4** + typing "9128" | Home card, + New album, number box, Create album. Lookup fills type and years. Good. |
| (b) 10 coins one at a time | **4 to 5 each** (grade only; A counts the 2-tap grade, B counts it as 1) = 40 to 50. **10 each** with price and photo = **100** | Where from, grade and price are chosen fresh each time; Where from carries over by itself (known N1). |
| (b) same 10 with Fill spots | **about 23** | Untick all, tick + grade per row, Save. Date and source asked once. |
| (c) Fill a spot with a coin I own | **3** | Only coins in no album (R5-15). Toast "Placed in ." (F22). |
| (d) Mark upgrade wanted | **3** | Missing for 9 grades (R5-10). Goes to General (R5-9). |
| (e) Take a coin out | **4** + 1 to leave Select | Known F18. |
| (f) See missing / make the list | **1** / **2 more** | Opening that list is 2 more from the menu. |
| (g) Dansco 7178 Morgans | **5 to 6** to create, then as (b) | The brand dropdown costs 2. Dansco 7100 Lincoln = 254 spots, about 6 screens, **no year jump** (A). Real Dansco page layout was **not checked** (neither agent could read it). |

**Easy to hit by mistake:** Hide spot / Remove spot next to Save with no question (R5-5); Fill spots "Tick all" right beside "Untick all" (one slip re-ticks all 54, P1); Delete album beside Edit album (known 111); a lit source chip turns off when tapped (known N2). **Too small:** "Show missing" 87x18; Reorder albums 122x22; spot arrows 37x30, touching; Fill spots row boxes 22x22; bottom Select all / Clear 57x18 and 33x18. "Save coins" in Fill spots sits below an 844-px screen, so the sheet must be scrolled.

**Tap-saver ideas (none exist in the app):** a "Save and next empty spot" on the album add form; folds that stay open between coins; Photo next to Grade; Edit on the filled spot menu; a year jump on long albums; a "Replace with..." on a filled spot. **Correction:** agent B listed "Save and next empty spot" and "Replace with..." as existing tap savers, and agent A listed "Next empty spot" the same way. I searched the code (`albums.js`, `wants.js`, `coinform.js`, `coinsave.js`): neither exists (the only "next empty spot" is the Storage box slot in `boxes.js`). Treat them as ideas, not features.

## Seen again, already known (worse in an album run)
- **N1 + N2 (rank 3):** one coin into the inherited album, and the next spot form in the *regular* album starts with Inherited lit; a quick tap on a lit chip turns it off and the coin saves with no source.
- **P4 (rank 8):** not only 1909 VDB. The 1878 "7 Tail Feathers" and "7 Over 8 Tail Feathers" spots each match 2 Red Book varieties, so the coin saves with no variety; Fill spots on the 3 1878 variety spots made 3 coins all called "1878 Morgan Dollar $1". That is also why they lose their spots in R5-8.
- F22, F18, 100, P1, P9: no worse than R4 says.

## How I used it that we didn't plan (workflows, not bugs)
1. **Swap in an upgrade:** no replace step; take the old coin out, then add the new one (R5-7).
2. **Move a coin between two albums** (e.g. Morgan album 1 to album 2): not offered (R5-15).
3. **Work through a stack of 2x2s in date order:** after each Save, back to the grid hunting for the next hole; no "next empty spot".
4. **Find 1955-S in a 254-spot Dansco Lincoln:** scroll 6 screens; no year jump or search.
5. **Bring back coins left in "Also in this album":** after hiding a spot, changing years or a CSV import, no tap puts a coin back in a spot (take out, then "Put a coin I already have here").
6. **Tap a date on the Missing list to add the coin I just bought:** rows only tick for a want list.
7. **Regrade after a second look:** 7 taps through the coin page (R5-14).
8. **Take the Missing list to a show:** the Missing sheet and want list have no print, share or export; he would screenshot 50 rows.

## Push back / limits
- **R4 rank 1 should grow, not stay narrow:** R5-1 (Fill spots and "Put a coin I already have here" never cross off the album's list) is the third path that ignores which list belongs to an album. One "each album uses its own list" fix should cover all three.
- **I could not run the real phone app** (github.io is blocked from here); both agents used copies from the repo files. VERIFIED-run means that, not the live app.
- **R5-10 and the claim that Hide spot has no Undo** are agent readings; I did not re-run them. Everything marked VERIFIED-code that I did not open myself is the agent's reading.
- **R5-21 (Dansco 7173):** one retailer listing only. Nothing about its contents is claimed.
- **Mintage** did not show in spot menus in agent B's runs, probably because no real price file was loaded; this is a GUESS, not a finding.

## One-screen summary
| Group | New | Worst ones |
|---|---|---|
| A wrong data in | 4 | R5-1 want list never crossed off; R5-2 1895 spot; R5-3 impossible spots; R5-4 variety edit |
| B hidden or lost | 7 | R5-5 hide spot / years; R5-6 variety spots lost; R5-7 upgrade swap; R5-8 CSV spots |
| C confusing / extra work | 10 | R5-14 folds closed (100 taps per 10 coins); R5-10 upgrade missing for 9 grades |
| **Total** | **21** (S 17, M 4, L 0) | None of the 21 needs a saved-data change except possibly R5-8 (a spot column in the CSV adds a field to an export, not to saved coins) |

Suggested fit if planning picks any (SUGGESTION only, he weighs in first): fold R5-1 into R4 rank 1 (Sonnet, S); R5-5 with R4 rank 5's "ask before it acts" group (S); R5-14 as one "keep folds open on album adds" fix (S).

Sources: [Dansco #7173 listing](https://infinitycoins.com/Products/dansco-album--silver-morgan-dollars-18781893--7173.aspx) · [Dansco 7178 listing](https://wizardcoinsupply.com/product/dansco-album-morgan-dollars-1878-1890.html) · [Dansco 7179 listing](https://www.apmex.com/product/565/dansco-album-7179-morgan-dollars-1891-1921) · [page 7179-1/7173-5](https://wizardcoinsupply.com/dansco-replacement-page-7179-1-7173-5-morgan-dollars-1891-to-1893-s.html)
