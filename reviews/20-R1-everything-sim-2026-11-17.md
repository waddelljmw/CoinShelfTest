# R1 Everything sim: report (app v0.77.2, Tue 2026-11-17)

Report only. No app code was changed. Three Opus sim agents ran in a browser at phone size on copies of the app (A: everyday collector flows, B: albums, storage, wants, backup, C: inheritance, selling, reports). Each was given the "already done / rejected" lists and ideas 99 to 116 as known. Findings below are merged and de-duplicated. Size is a guess: S small, M a feature, L big or changes saved data. **Where I expected it** = where a user would look.

## Verdict
Nothing crashed and the old problems from reviews 01 to 06 are mostly fixed. **But 4 things can silently lose or hide data and need a fix before charging**: metal prices wiped by a fast Back, a restore that hides coins in added album spots, turning a box into a for-sale case (skips the inherited check, then one tap clears every coin's place), and editing a sold coin to Inherited (changes sales totals with no question). A half-filled form also disappears on Back with no question.

## Review 19 effect on R1
It added four hand-checks. Results: (1) inherited guard has 2 gaps (F3, F4 below); (2) backup then restore into a fresh app is OK, old-over-new is OK and warned, but two restore cases hide album coins (F2); (3) values agree on every screen, one small label problem (F14); (4) a brand-new user with no price file gets honest numbers but dishonest words (F8). Its license finding is partly out of date: an all-rights-reserved LICENSE was merged in #264 after review 19 was written. The public repo and free public copy remain a business decision.

## Ranked findings
| # | Sev | Size | Area | What happened | Expected | Where I expected it |
|---|---|---|---|---|---|---|
| F1 | B **DATA RISK** (prices) | S | Options > Spot prices (A1, C1) | Typed a gold price, then Back within 0.7 s: **all** spot prices wiped (silver $30 too). Melt went to $0, Home dropped. Cause: the save timer in `actions.js` ~332 to 340 reads the boxes after the screen changed. | Keep what was typed, never clear other metals | Prices stay after leaving |
| F2 | B **DATA RISK** (coin hidden, not lost) | M | Restore (B2, B3) | (a) Back up, add a spot "1878 VAM-9" with a coin, restore the backup: spot gone, coin page says "In Whitman 9128" but the album page doesn't show it (Owned 2/54, Album value counts 3). Confirm says only "albums replaced". (b) The old v0.58 test backup restores albums with **0/0 spots** and no Fill spots. Not yet checked if real v0.58 albums were saved that way. | Keep the spot, or warn by name; rebuild spots on read | Restore confirm, Albums |
| F3 | B | S | Edit box to Dealer case (C2) | A box holding 3 inherited coins was changed to a for-sale case with no question. | Refuse or ask, like Move to does | Edit box |
| F4 | B (place loss) | S | Dealer case (C3) | "Return unsold coins" is one tap, no confirm. All 6 coins (3 inherited) lost box and album. Only the short Undo helps. | Ask, or leave alone coins that never moved in | Case page |
| F5 | B | S | Edit a sold coin (C4) | Sold a coin $10, Edit, tapped Inherited, Save: no question. Home Sold went 1 / $10 to 0 / $0 and the tax row lost its cost basis. | Ask or block on sold coins | Edit form on a sold coin |
| F6 | B | S | Wants, neighbour of 99 (B1) | Two Morgan albums, each with its own Missing list. Adding the 1880 coin in Uncle's album dropped the **Whitman** list 49 to 48; Uncle's list still showed 1880 wanted. Cause: spot uses the first matching want on any list (`wants.js`). Also owned spots show "wanted" because of the other album's list (B11). | Cross off this album's own list | Album's own list |
| F7 | B | S | Add/Edit form (A2) | Back or a tap on the strip above the sheet closed a half-filled Add form with no question; Edit + Back dropped a grade change silently. | "Discard this coin?" or keep draft | Back = close but ask |
| F8 | B | S | New user, no price file (A3, A4, B9, C8) | Every coin page says "No Red Book value for this date and grade" as if the book was checked; report says "otherwise the Red Book retail value". "Load a price file" is only at the bottom of Coin Value (not Options > Prices and values) and says "pick the file you saved from this app", which a new user never made. Demo shows Gain -35.1% (no book), looks broken. | "No price list loaded yet" + a link in Options | Options > Prices and values |
| F9 | B | M | Levels (A4, B8) | Simple and Collector still show For sale, Mark as sold, Move to Business, Asking price, "Suggested if you list it"; Simple Home shows Albums, Storage, Business stock, For Sale list, Recently sold. | Selling hidden at Simple and Collector | Simple = Home, My Coins, Value |
| F10 | B | M | Refund reports (C5) | Sold 2 coins as one Whatnot order, refunded one. Summary fees $12.18 but "By platform" $5.73; Sales CSV rows add to $5.73 while its summary says $12.18; tax CSV omits the refund's $8.83 fees and shipping. | Same number, or a note | Sales Reports, both CSVs |
| F11 | B | S | Refund (C6) | "Refund or cancel" acts at once, in one row with Edit sale, Move back, Delete. | One-line confirm | Sold coin page |
| F12 | B | M | Business coin, Seller Mode off (C7) | Album value includes a Business coin; Home and Insurance report ("All coins (3)" vs My Coins 5) leave it out; no Business tag on its page; report still offers "Include Business stock". | Label it or explain the gap | Album page, coin page |
| F13 | B | S | Spot-fill / Kept in (B4) | "Put a coin I already have here" places it in the album but its box slot stays filled; coin page, box page and CSV show both places. | Free the slot or ask | Spot menu |
| F14 | C | S | Insurance report label (A9) | 1946 nickel lifted to face shows $0.05 but "Value basis: Melt". | "Face value" | Report |
| F15 | B | S | Search (A5) | "1921 morgan", "morgan 1921", "franklin ms-64" give 0 results; "1921-D" and "morgan" work. | Words in any order | Search box |
| F16 | B | S | Filter (A6) | No "Where from" filter, though the Save-filter placeholder says "e.g. Inherited silver". | Source filter | Filter panel |
| F17 | B | S | Add many (A7) | "How many separate coins?" is two folds deep, beside a second "Quantity". | Near the top, under Grade | Add coin |
| F18 | B | S | Take out of album (B5) | Only under Select (5 taps). Not on a filled spot's menu or the coin page. | One tap from the spot | Filled spot menu |
| F19 | B | S | Pocket albums and boxes (B6) | "+" on an empty pocket/slot opens only a new-coin form. | "Put a coin I already have here" | Pocket "+" |
| F20 | B | S | New album (B7) | Typed Whitman 9113 (not in list): no message, Create made a 65-spot Half Cent album. | "Not in our list, pick the coin type" | Under Album number |
| F21 | B | M | Bars-only (B13) | Silver only; bars called "coins" ("2 coins need info"); premium list shows bars at +0.0%. | Bar words, more metals | Add bar form |
| F22 | C | S | Album names (B10, A10) | Gray name shown but saved as "Whitman 9128"; toast "Placed in ." and confirm "Delete ?". Code uses the raw typed name (`actions.js` ~195, `wants.js` ~506). | Display name everywhere | Toast, confirm |
| F23 | C | S | Wording leftovers (A8, A11, A12, A14, C10) | "No Red Book value" on foreign coins; "Fill in from photos: coming soon" still on every real Add form (hidden in Options by 108); demo claims the form fills itself; medal hint mentions a type list that isn't there; "1 coins"; empty type chips on a 3-coin collection; header "Inherited · do not sell" after "sell eventually"; Seller profile "Used on reports later"; restore warning names albums and want lists but boxes are replaced too. | Matching words | Various |
| F24 | C | S | Home counts (A13, old T5a) | Shelf "My Coins 103", list "In collection (112)", Home "118 items"; the note explains 118 only. | One number | Home shelf |
| F25 | C | S | CSV (B12, C9) | Export has no Value column for melt-valued coins; import into an app without that album drops Album with no message; refused inherited row says "taken or missing"; Business/Personal and "Inherited from" are export-only (lost on re-import, READ-ONLY); imported inherited coins get no default inheritance. | Say what happened | Export, import toast |
| F26 | C | S | Holder (B14) | After Delete album or Take out, loose coins still show "Holder: Album". | Clear it | Coin page |

## Tap counts
- **Add coin:** 8 (+, US coin, year, type, pick, mint, grade, Add). First coin adds the silver-price pop-up. With a numbered box spot: 11. First inherited coin: 13 entries.
- **Add to album spot:** 4 new coin (spot, Add coin to this spot, grade, Add); 3 with an existing coin. Fill spots saves many in one go.
- **Mark sold:** 3 plus the price; inherited 5; two coins together about 8.
- **Find a coin:** 3. **Take out of album:** 5.
- **Too easy to hit:** the ~50 px strip above every sheet closes it. Edit, For sale, Mark as sold, Delete sit about 8 px apart in one row (Delete now asks, Refund does not). "Return unsold coins" sits next to "Set asking price for all".

## How I used it that we didn't plan
- Used each album's "Add missing" list as a per-album shopping checklist (this is how F6 was found).
- Read the CSV "Kept in" column as a "where is everything" list (found F13).
- Typed the Save-filter name as a source filter ("Inherited silver") with nothing behind it (F16).
- Turned a box my coins already lived in into a dealer case instead of moving coins into a new one (found F3, F4).
- Left Year empty to make a mixed-date wheat roll: works nicely.

## Old problems confirmed fixed
Source up front; "Type it in" opens Spot prices unfolded; Add another; junk silver by face value; cardboard box with no forced spots; Delete asks first; Needs info counts agree; nickname search (walker, wheat penny, merc); inherited guards on Mark as sold, For sale, Business, Sell together, bulk Change source, CSV; fresh restore matches coin count, totals, photo, inheritance, price list.

## Not tested
Pocket album details, series reordering and proof spots, swap trays into a dealer case, a box inside a box (read only), importing the same CSV twice, photos beyond one tiny image, Back and Forward in depth, the first-open guide, Recently deleted, snapshots, the deep Whatnot run (R3), earlier owners in inheritance history, iPhone and real touch, big collections. Items marked READ-ONLY above were found by reading code, not by running.

## Ideas for R4 to rank
Group by who gets hurt: **lose or hide data** F1 to F5; **wrong numbers or words** F8, F10, F12, F14; **extra taps** F15 to F20. F1 and F7 look like one small "don't close or save silently" fix. F2 and F3/F4 touch how coins and boxes are saved or restored: Opus, ask him first, 4-box check.
