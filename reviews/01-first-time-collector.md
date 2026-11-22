# Test-user review 1: the first-time collector (session 22)

**How it was run:** a pretend new collector opened a fresh, empty copy of the app (phone-sized screen), added 10 US coins (2 Morgans, Peace, Walking Liberty, Standing Liberty, Mercury, Roosevelt, Buffalo, Jefferson, Lincoln wheat), then opened every page in the top-right menu, Options, the New album form and the Hide values switch. Done by script on a test computer.

**Not tested (be careful trusting this review on these):** live metal prices (no internet in the test), photos, real touch feel, backup/restore, Undo after delete, filling an album, selling.

## App-store-style review: ★★★★☆
"Adding a coin by typing its name is quick: search, pick, year, mint mark, grade, Add. The mint mark list only shows the mints that really struck that coin, which I liked. Each coin page shows its ID, mintage and a Red Book value. Then I hit a wall: my silver Walking Liberty half showed $0.50 and Home said Melt value $0.00. I almost thought the app was broken. Four stars because the basics are great once you know where things are."

## What was useful
- Add by name: about **7 taps/entries per coin** (+, US coin, type name, pick, year, mint mark, grade, Add coin).
- Mint mark list matches the coin; metal and ounces fill in on their own (Morgan: silver, 0.77344 oz).
- Coin IDs (MD-002), mintage, "Suggested if you list it", eBay sold link.
- Empty pages (Albums, Storage, Stacks, Want List) each say what to do next.
- Hide values, the backup reminder and the Coin Value page by type.
- Shows and Sales Reports stay out of the menu until Seller Mode is on. Good for a plain collector.

## What was confusing or broke (no crashes found)
1. **Silver coins look nearly worthless until a silver price is entered.** Home showed Collection value $570, Melt $0.00, "no spot price". Silver coins showed face value ($0.50, $0.25, $0.10). Nothing says "this is face value only".
2. **Red Book values: only 3 of 10 coins got one** (the Morgans and the Peace). The rest fell back to face value or "—" (e.g. 1936 Buffalo F-12 $0.05, 1950-D Jefferson MS-63 $0.05, 1930 Standing Liberty VG-8 "—"). Possibly missing data, possibly correct. **Check against the Red Book; nothing was guessed here.**
3. "Tap to enter metal prices" opens Options, but the **Spot prices section is still folded**, so one more tap is needed. (All 16 Options sections start folded.)
4. After saving, the app shows the coin page, so adding the next coin means **+ then US coin again**. No "Add another".
5. Words a newcomer won't know: *Melt value, Spot prices, Red Book, Kept in, Seller Mode, Share a snapshot, Photo fill (API key)*.
6. The locked "Fill in from photos · Coming soon" box sits at the top of every Add coin form and mentions an "AI key".
7. New album form puts a very long list of coin types ahead of what most people want (brand and album number).
8. Console showed failed network loads. Expected in the test (no internet); not counted as a bug.

## Ranked wish list
1. On the first silver/gold coin, ask for (or fetch) the metal price, and label face-value fallbacks as "no silver price yet".
2. "Add another" button after saving a coin.
3. Say "No Red Book value for this date/grade" instead of silently showing face value; review the pricebook gaps with your Red Book.
4. Make "Tap to enter metal prices" open Spot prices already unfolded.
5. Short plain-words help (tap a word to see what it means).
6. Hide or shrink the locked photo-fill box while it is locked.
7. Album form: brand and number first, coin-type list later.
