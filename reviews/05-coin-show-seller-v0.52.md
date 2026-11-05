# Test-user review 5: the coin-show seller, second run on v0.52.0 (session 22c)

**How it was run:** a pretend part-time dealer ("Ridgeway Coin & Bullion") opened a fresh, empty copy of the app (phone-sized screen, no internet, so prices were typed in: gold $2,650, silver $31.50, copper $4.40). They picked Everything, skipped the walk-through, turned on Seller Mode and filled in the business profile (name, EIN, address, sales-tax permit). Then they added **26 items through the real forms**: 9 raw coins (Morgans, Peace, Silver Eagle, Franklin, Kennedy, Buffalo, Indian Head, Barber), 3 slabs (PCGS 1884-CC Morgan, NGC 1938-D Walker, PCGS 1945 Mercury), a Roosevelt dime album with 5 of its spots filled, a BU roll of 1964 dimes, a 1964 proof set, a 10 oz Engelhard bar, 20 junk-silver quarters, and 5 coins in "Black box 1" (2x2 flips). They moved 18 items to Business stock with Select (and the bar from its own page), made a Dealer case, moved 12 coins in, set asking prices, made a 3-day show with $470 of costs, sold **11 times (20 items)**: 8 at the show (cash, card with fees and sales tax, Venmo, 10 of the 20 quarters), 1 on eBay with shipping and tracking, 1 private sale (the bar, Zelle) and 1 on Facebook. Then: Return unsold coins, show page, Home, For Sale list, price list, share as text, Sales Reports, both CSVs, tax records, the coins CSV, Coin Value, Hide values, and a reload to check IDs. Done by script on a test computer; all numbers checked by hand.

**Not tested (don't trust this review on these):** printing to paper or PDF (the HTML files were read), photos, real touch feel, live prices, backup/restore, offline at a real show, Attendee shows, Whatnot sales (next review), hundreds of coins.

## App-store-style review: ★★★★☆
"Big step up from my last try. The case now starts at 2 rows of 6, one button priced the whole case, the show I was at was already picked when I sold, and card fee, tax and payment are right there. The show page told me how much more I had to sell to cover my table and hotel, and the year-end page has a Schedule C summary and a 1099-K check. My IDs stayed put after a restart. Four stars: half my stock has no Red Book price, the 'price everything' button put one coin below what I paid, and my tax file has no purchase dates because the app never asked for them."

## What worked well
- **Last review's top problems are fixed:** IDs stay the same after a reload (checked all 26); Dealer case defaults to 2 rows of 6; **Set asking price for all**; **Print price list** and **Share as text**; sold form picks the running show and shows fees, sales tax and Paid with up front; a future sale date warns ("That date is in the future. Is that right?"); Home says "before show costs"; show page has a break-even line ("Sell $409.04 more to cover show costs").
- **Selling part of a lot:** the 20 quarters asked "How many sold (of 20)" with Just 1 / All 20 / type a number. Sold 10; 10 stayed.
- **eBay fees fill themselves** from Options rates when you pick eBay and type the price ($3.05 on a $20 test).
- **All report math checked out:** sales $1,345.60, cost of coins $1,219.00, fees $47.62, show costs $470, profit −$391.72; sales tax $32.95 kept apart; by-platform gross (coin show $758.55 incl. tax); Schedule C lines (table $175, travel $250, meals $45); printable page carries the business name, EIN, address and permit.
- **Return unsold coins** sent the case coins back to their box slots and kept their asking prices.
- Sold coins free their case slot right away (case went 12 → 3 of 12).
- Junk silver: Washington quarter + grade "Junk" + Quantity 20 worked; it valued at melt and went to My Silver Stack.

## What was confusing or broke (no crashes, no script errors)
1. **"Set asking price for all" can price below cost.** Red Book × 90% put the 1922 Peace at $31.50 (paid $33; For Sale list shows "−$1.50 before fees") and the 1884-CC at $414 (cost + 10% = $418). Each coin's own note says the suggestion is "never below your cost + 10%", but the bulk button only offers Red Book × 90% (7 of 12) or Melt + 10% (12 of 12), not "the suggested one".
2. **Many coins have no Red Book value**, so they price and value at melt: 1938-D Walker NGC MS-65, 1945 Mercury PCGS MS-66, 1963-D Franklin MS-63, 1964 Kennedy MS-63, Roosevelt dimes MS-64, 1943 Walker XF-45, 1942-D Mercury XF-45, 1911 Barber F-12, 1907 Indian VF-20, 1937 and 1936-D Buffalo. The coin page now says "No Red Book value for this date and grade" (good), but Business stock shows Value $221.95 against Cost $316. **Check against your Red Book; nothing was guessed.**
3. **Tax records have no purchase dates.** The Add coin form never asks for Date acquired (it's inside Purchase details), so all 11 rows in the tax CSV have a blank "Date bought" and "Held over 1 year".
4. **"Paid with" carries over from the last sale.** The eBay sale was saved as "Cash" because the previous show sale was cash. Fixed with Edit sale.
5. **Edit sale doesn't refill eBay fees** when the price is retyped (Mark as sold does).
6. **Tapping "✓ My Silver Stack" at the top of Home quietly drops it from the totals.** I tapped it looking for the stack (the shelf below has the same name); Home then said "Leaving out: My Silver Stack" and showed 0.00 oz.
7. **Business and personal get mixed on two pages:** My Stacks says "My Silver Stack · 21 items · 13.6 oz" (includes the Business quarters) while Home shows 1 item, 9.99 oz; Coin Value lists Business and personal coins together with no split.
8. **The coins CSV has no Business/Personal column**, so an exported inventory can't be split.
9. A sold coin's page still says "Storage box: Show case A · Row 2 · Slot 1" (the slot is actually free).
10. Options → Seller Mode still says "and later dealer cases, shows and reports" and "Used on reports later"; they all exist now.
11. Show page "Sold here" isn't in date order. Home counts still differ (Coins 45 / My Coins 22 / In collection 44), same as review 4.

## Business features looked for but not found
- **Sell several coins to one buyer as one sale** (one total, one payment). Select has no Mark sold; each coin is its own sale.
- **Set an asking price or put For sale for many coins outside a dealer case.** The 6 Business items not in the case never got a price.
- **A receipt or invoice for the buyer.**
- **Refunds or returns** after a sale (only "Move back to collection").
- **Buying at the show:** coins bought at the table aren't tied to the show, so the show page shows sales only.
- **Trades** (coin for coin as one deal).
- **Price tags or flip labels** to print (the price list is one page).
- **Holds/layaway and consignment.**
- **Mileage at a per-mile rate** (Gas / mileage is a dollar amount only).
- **Business stock by type or age** (how long a coin has sat unsold).

## Counts
Raw coin through the form: **8–10 taps/entries** (source is remembered). Slab: 11. Album spot: **5** (tap spot, Add coin to this spot, grade, paid, Add coin). Box slot: 8. Moving 18 coins to Business: Select, Select all, untick 7, Move to Business. Pricing a 12-coin case: **2 taps** plus 5 single taps for coins with no Red Book value. A sale at the asking price: **4 taps**; with card fee and tax: 7.

## Ranked wish list
1. Bulk asking price that follows the per-coin rule ("suggested, never below cost + 10%"), usable from Select on any Business coins, not just a case (finding 1).
2. Fill the Red Book gaps above (finding 2).
3. Ask for Date acquired on Add coin when Seller Mode is on (or default it to today) so tax records work (finding 3).
4. One sale for several coins to one buyer, with a simple buyer receipt.
5. Don't carry "Paid with" over between sales, or carry it only within the same show (finding 4).
6. Keep Business apart on My Stacks and Coin Value, and add a Business column to the coins CSV (findings 7, 8).
7. Make the top-of-Home stack chip clearly a switch ("Count in totals") (finding 6).
8. Tie coins bought at a show to that show, so the show page shows buys and sells.
9. Small wording fixes (findings 9–11).
