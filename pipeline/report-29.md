# 29 · Step 15c: fix check before testers (2026-11-20, Opus, solo)

App v0.101.2. A simulated tester re-ran the fixed findings in a phone-size browser (390x844), mostly by real taps on `?demo=full`, plus a fresh empty app, Extra large text, two tabs and a CSV round trip to a new phone. Report only: nothing in the app changed.

## Verdict
Almost every fix holds. **50 checks confirmed**, **2 half-done**, **4 new small findings**, 0 broken, nothing that risks saved coins. All six leftovers are small (S) and fit one Sonnet step (**15d**) before the private tester copy (4b).

## Half-done (go back in the queue)
| Code | What the fix promised | What the tester saw |
|---|---|---|
| **R5-4** (variety edit moves the coin) | Change a coin's variety and it moves to the matching spot, "or back to the plain one" | 1909-S VDB coin in the VDB spot, Edit, Variety "Regular (no variety)", Save: coin says Regular but still fills the **VDB** spot; plain 1909-S spot stays open. No question asked. (`coinsave.js:105-110` only moves when the new variety is not blank.) |
| **R6-5** (eBay link off the coin rows) | eBay link only on the coin page | Coin Value's **"Highest premium over melt"** list still has an "eBay ↗" link on every row, 20 px tall; on a long name it wraps to "eBay / ↗". A slip still leaves the app. |

## New findings (all S, Sonnet, no saved-data change)
| # | Where | What happens | Fix idea |
|---|---|---|---|
| **N1** | Add coin | When your last coin had no Where from, every new coin shows an empty chip **"Same as last: Where from:  ✕"**. Fresh app: all 9 coins after the first. (`coinform.js:74` adds the chip even when the source is blank.) | Only show the chip when there is a value. |
| **N2** | Guided first coin | After Save, the toast says "Tap the + button to add the next one". Doing that leaves the **step 7 bubble** ("This is your coin…") floating over the new Add coin form, covering Mint mark and Grade, until Done is tapped. | Close the guide when a new form opens (or when + is tapped). |
| **N3** | Pop-ups + messages | A message or Undo toast sits over the bottom of an open pop-up and **takes the first tap** meant for a button under it (seen 4 times, e.g. "Want an upgrade" right after "Add to want list"). Not a data risk; feels like a dead button. | Lift the toast above the pop-up's buttons, or let taps pass through outside its own Undo/✕. |
| **N4** | Import preview on a new phone | Preview shows **face value** ($1.00 for an MS-63 Morgan, $2.50 for a gold $2.50) because no metal prices are set yet. Looks like the app thinks your coins are worth face. | Show "—" (or "needs metal prices") when the value is only face for a silver/gold coin. |

## Watch for a missed Undo (R8-3)
No Undo was missed by the scripted tester. Measured: plain messages 1.5 s, Undo 5 s (6 s for long ones), error messages ~3-4 s (80 characters). These are the times he chose in idea 123 (shorter pop-ups). Borderline for a slow reader; left as is. N3 is the bigger annoyance.

## Fresh empty app pass
Starts on Collector; welcome card has Start my collection / Try with sample coins / I have a backup file. The 7-step guide walks year → type → grade → Where from → paid → save → "This is your coin" and saves a correct coin. Nine more coins logged with no dead ends; the app correctly stopped a 1943 "Jefferson Nickel" and pointed to the War Nickel. Needs info then lists what's missing and "Check the mint mark". Found N1 and N2.

## Big text and small taps pass (Extra large text)
Home, My Coins, an album, Coin Value, Options, Want List, Storage, Melt Table, a coin page and Add coin: **nothing scrolls sideways, nothing is cut off**. Add coin fold headers 46 px; row star 44x44; album grade 13 px; the + button covers nothing at the bottom of a page. Small links left: "PCGS photos ↗" (coin page) and "Look up current prices" (Options), both 20 px tall (not in a fix's scope; fine for now). Premium-list eBay links: see R6-5.

## Confirmed (re-run by taps unless noted)
- **Albums:** R4-1 other album's list not shown · R4-4 Fill spots unticked + Tick all · R4-7 offers your loose coin · R4-8 VDB spot saves VDB · R4-10 no type, no album (Create stays off) · R4-30 no "Holder: Album" after take-out · R4-35 "upgrade wanted" label · R4-36 Take out on the spot · R5-2 1895 "Proof only" + proof grades only · R5-3 1880-D spot refused · R5-5 Hide spot asks · R5-6 variety spots return · R5-10 upgrade for XF-45 · R5-11 inherited not grouped · R5-12 "Whitman 9128 (2)" · R5-15 Move to another album · R5-16 delete asks about its list · R5-17 "Needs silver price" · R5-18 pocket value · R5-19 one-tap want · R5-20 Undo gives IDs back · R6-11 grade 13 px
- **Entry:** R4-3 "Same as last" chip + one-tap clear · R4-9 impossible year flagged · R4-11 Check mint in Needs info · R4-23 Back keeps metal prices, asks "Discard this coin?" · R4-31 Needs info doesn't stick · R4-33 search "1921 morgan", "1950 D", "silver", "grandpa" · R4-37 Where from filter · R4-40 one how-many box · R4-45 missing spots under a type · R5-14 folds stay open
- **Selling:** R4-6 sold → Inherited asks · R4-14 second tab warns, first sale kept · R4-16 refund returns to For sale · R4-24 Undo on Take off sale and Refund · R4-34 Simple hides selling · R4-61 Business-only Home
- **Setup / look:** R4-21 one coin count (193 + 39 inherited = 232) · R4-26 full sample asks · R4-27 hide values (coin page, My Coins) · R4-38 backup button · R4-48 Options groups · R6-1/R6-2 text size · R6-3 · R6-6 · R6-7/16c message times · R6-13
- **Spreadsheet:** CSV of the whole demo into an empty phone: 229 coins, 6 Business, 39 Inherited (with the inheritance name) all kept; coins whose album isn't there yet get a clear message.

**Not re-run by taps** (their GitHub tests pass on main): R4-5, R4-15, R4-17, R4-20, R4-22, R4-28, R4-39, R4-41, R4-42, R4-58, R5-7, R5-8, R5-9, R5-13, R7-1, R7-2, R7-3, R8-1, R8-4.

## Known gaps (not fixed, listed for testers)
- Two-tab sale guard covers Mark as sold only; sell-several, Edit and Move are not guarded (R8-2).
- Restore over newer data is only partly fixed (R4-25): the warning is honest, the deeper merge isn't built.
- Fractional gold bars are not done (needed before a wider audience).

## Queue
New step **15d "Fix check fixes"** (Sonnet, ~1 weekly, 30-45 min): R5-4 rest, R6-5 rest, N1, N2, N3, N4. Before 4b (private tester copy). Waits for his OK, as with R8.
