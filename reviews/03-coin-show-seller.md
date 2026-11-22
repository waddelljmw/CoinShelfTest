# Test-user review 3: the coin-show seller (session 22)

**How it was run:** a pretend amateur seller opened a fresh, empty copy of the app (phone-sized screen), typed a silver price ($32), gold ($2,400) and copper ($4.50) in Options (the test computer has no internet, so live prices never load), turned on Seller Mode and typed a business name and permit number. Then: added 5 coins as Business stock "For sale" through the real Add coin form, built a Dealer case (2 rows of 4), moved all 5 in with Select, created a 3-day show with costs ($470), sold 3 coins at the show (cash, card with fees and sales tax), returned the unsold coins, and read Home, For Sale list, Show page and Sales Reports. Done by script on a test computer.

**Not tested (don't trust this review on these):** saving the report as a file, printing, photos, real touch feel, live prices, a Whatnot/eBay sale with shipping and tracking, Pricing options changes (Fee rates, Asking price rules, Shipping costs), Attendee role, Hide values at the table, backup/restore, Undo, a large stock of hundreds of coins, using it offline at a real show.

## App-store-style review: ★★★★☆
"Finally an app that thinks like a table at a show. I put my coins in a 'Show case', the app switched them to For sale and suggested prices, I tapped one and sold it in three taps with the price already filled in, and at the end it showed what the weekend actually made after the table fee, gas and hotel. Sales Reports even has a tax-style summary. Four stars: three of my five coins got no suggested price at all, and the ID I wrote on a flip changed the next time I opened the app."

## What worked well
- **Selling is fast.** Coin page → Mark as sold → pick the show → Mark sold. The price is pre-filled with the asking price, "Where" fills itself with "Coin show", and a live line says "Profit: $15.00 after what you paid ($55.00)…". Math checked by hand: Morgan 70−55 = 15, Peace 63−38−1.83 fees = 23.17 (sales tax left out), Mercury 4−6 = −2.
- **Dealer case** moves coins to For sale, remembers where each came from, and "Return unsold coins" sends them back in one tap.
- **Show page** shows sales, coin cost, fees, each show cost and profit (−$433.83 after $470 of costs), plus "Sales tax collected: $3.78. It isn't profit."
- **Sales Reports** month/quarter/year, by platform, a "Schedule C style" summary, Business stock at cost ($25.00 = the two unsold coins), printable page and CSV, and a "not tax advice" note.
- Business stock stays out of Collection value and Cost/Gain on Home. Menu shows "My Business" only in Seller Mode.
- Suggested prices (Red Book × 90%, Melt + 10%) are shown as tappable choices.

## What was confusing or broke
1. **A coin's ID changes the first time the app is reopened (reproduced three times).** A new Morgan showed MD-001 after saving; after one page reload it was MD-002, and the number 001 was used up. In the first run all 5 coins showed -002. Cause (not fixed here): the saved record is written without the ID; the ID is added later in memory only, so the next start hands out a new one. For a seller who writes the ID on each flip, this is the biggest problem. Needs a fix and a test; also check old coins (they get a new ID once, then keep it).
2. **3 of 5 coins got no suggested price: 1942-D Mercury Dime XF-45, 1943 Walking Liberty Half AU-50, 1936-D Buffalo Nickel VF-20.** The case page says "No price", the For Sale list says "Asking $0.00", and Value each shows melt (Buffalo: $0.04). Possibly missing pricebook data or ungraded-range gaps. **Check against your Red Book; nothing was guessed here.** (Same as IDEAS 29.)
3. **Two different "profit" numbers.** Home → Sold results says "+26.4%, $36.17 profit"; the show page and Sales Reports say −$433.83. Both are right (Home leaves out show costs) but a seller will ask which is real. Add a short label on Home: "before show costs".
4. **Sale date defaults to today, not the show's dates.** The show was Nov 6–8; the sold form opened on Nov 3. I typed the dates by hand. Also a sale dated in the future was accepted without a warning. Suggest: when a show is picked, offer the show's first day (or today if the show is running).
5. **Fees, sales tax and payment method are hidden under "More details"** on the sold form. At a busy table the card fee and tax are exactly what a seller enters. Consider remembering the last payment method or showing Paid with / tax up front when a show is picked.
6. **Dealer case needs rows and slots, and the error is vague.** Leaving them empty gave "Add a name, 1–50 rows or columns and 1–100 slots in each." A seller doesn't think in slots. Suggest defaults (e.g. 2 rows of 6) for a Dealer case.
7. **No way to price many coins at once.** The 3 unpriced coins each need Edit → Asking price. A "set ask to Red Book × 90% for all" action, or a price column on the case page, would save a show-prep hour.
8. **For Sale list has no printable price list or price tags.** Booth owners want a one-page price sheet or tags to print (or share as text).
9. After "Move to…" the Select screen stays open with all ticks; easy to move twice by mistake. (Undo is offered.)
10. Case page lists coins in a different order from the slot grid (Mercury before Buffalo in the list; Buffalo is in slot 3, Mercury in slot 4).
11. The My Coins type chips list every coin type even when the collection is empty (and none are seller-specific); long on a phone.
12. The locked "Fill in from photos · Coming soon" box is still at the top of every Add coin form (same as reviews 1 and 2).

## Counts
Adding one business-stock coin through the form: about **13 taps/entries + Add coin** (+, US coin, type search, pick, year, mint, grade, open Purchase details, paid, source, open Status, For sale, Business group), plus 1 tap on a suggested price. Selling one: **4 taps** when the price is as asked (open coin, Mark as sold, pick the show, Mark sold).

## Ranked wish list
1. **Fix the changing coin ID** (finding 1). Biggest, and cheap to fix.
2. Fill the pricebook gaps / say "No Red Book value for this date and grade" (finding 2, IDEAS 29), and "Set asking price for all" in the case.
3. Printable price list or tags for the booth (finding 8).
4. Sold form: default the date to the show, keep fees/tax/payment visible when a show is picked (findings 4 and 5).
5. Label Home's profit "before show costs" (finding 3).
6. Dealer case defaults (finding 6).
7. A "break-even" line on the show page: how much more you must sell to cover show costs.
8. Plain-words help (IDEAS 31) for Business stock, Dealer case, Going as.
