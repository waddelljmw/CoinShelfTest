# Test-user review 6: the Whatnot live-stream seller, run on v0.52.0 (session 22d)

**How it was run:** a pretend part-time Whatnot seller ("Whatnot Wanda Coins") opened a fresh, empty copy of the app (phone-sized screen, no internet, so prices were typed in: gold $2,650, silver $31.50, copper $4.40). It is the same v0.52.0 files as the live app, run in a test browser on a computer (not the github.io copy, not a phone). The seller picked Everything, turned on Seller Mode and filled in the business profile. Then they added **27 items through the real forms**, all as Business stock: 18 raw coins (Morgans, Peace, Mercury, Walking Liberty, Franklin, Kennedy, Buffalo, Indian Head, Lincoln wheat, Barber, Standing Liberty, Roosevelt, Washington, Jefferson, Eisenhower), 4 slabs (NGC Silver Eagle, PCGS 1884-CC Morgan, NGC 1938-D Walker, PCGS 1945 Mercury), 20 junk-silver quarters, a 1 oz round, a 10 oz bar, a BU roll of 1964 dimes and a 1964 proof set. They set up a **"Whatnot live" show** with its costs, then **sold 10 times (14 items)** on the stream: Whatnot fee estimate, shipping charged and paid, buyer name, order number and tracking. Then: show page, Home, Sales Reports, both CSVs, the tax records CSV, the printable report, the coins CSV, Select, a reload to check IDs, an 11th sale using saved shipping costs, and a refund. Page text only, no screenshots. All report numbers were checked by hand.

**Not tested (don't trust this review on these):** printing to paper or PDF (the HTML text was read), photos, real touch feel, live prices, backup/restore, offline at a real stream, the real Whatnot app or its payouts, hundreds of coins. The Whatnot fee rates were taken as the app states them (4% + 2.9% + 30¢); I did not check Whatnot's current rates.

## App-store-style review: ★★★★☆
"Finally an app that knows what a Whatnot live is. I picked 'Whatnot live' when I made the show, and every sale picked the show, Whatnot and the fee estimate on its own. The fee, shipping, buyer, order number and tracking were all in one form, and the report matched my hand math to the cent. Four stars: when two coins go to the same buyer in one order the app charges the 30¢ twice, there's no way to record a refund without erasing the sale, and my stream costs (ring light, mailers) had to go in one 'Other' box. The numbers for 'profit' also differ between pages."

## What worked well
- **Show kind "Whatnot live"** sets Where to Whatnot and picks the running show on the sold form. The show page says "Sell $97.00 more to cover show costs" before sales and "Show costs covered" after.
- **Whatnot fee estimate fills itself** once the price is typed, and follows shipping charged: $92 sale → $6.65; add $5 shipping charged → $6.79 (the 2.9% applies to the whole order). It matches the rates shown in Options → Selling.
- **All report math checked out** (10 sales, 14 items): sales $670.00, shipping charged $40.00, cost of coins $477.50, fees $50.40, shipping paid $41.67, show costs $97.00 (food $12 + other $85), profit **$43.43**. The Schedule C summary (gross receipts $710, meals $12, other show costs $85, total expenses $189.07) and the "Whatnot · check 1099-K" line ($710 gross, $50.40 fees) agree.
- Selling part of a lot worked (5 of 20 quarters; 15 stayed). The printable report carries the business name, EIN, address and permit.
- **Order number and tracking are saved**, shown on the sold coin page with a "Track package" link, and appear in the coins CSV.
- IDs stayed the same after a reload (all checked). Roll, set, bar and round forms all worked. No script errors.
- Once "Usual shipping cost" is set in Options, **Shipping you paid** fills in by itself ($4.63 on the 11th sale). "Paid with" carried over from the last sale (Card), which suits a stream where everything is a card.
- Tax records CSV has Date bought for every row (Date acquired was filled in on each item), so "Held over 1 year" works.

## What was confusing or broke (no crashes, no script errors)
1. **Two coins to one buyer in one order are two sales, and the 30¢ Whatnot flat fee is added to each.** The 1925-S Peace ($85) and the 1964 Kennedy ($30) went to the same buyer on order WN-1005; the app estimated $6.31 + $2.37, each with its own 30¢. The real fee is one 30¢ for the order. Shipping paid and tracking also have to be typed twice.
2. **Three or four different "profit" and "sales" numbers.** Home → Sold results: $140.43 profit (includes shipping charged, before show costs). Show page: Sales **$710.00** (includes shipping charged), profit $43.43. Sales Reports: Sales **$670.00** (shipping charged $40.00 shown apart), profit $43.43. Tax CSV: total gain **$142.10** (leaves out shipping and show costs). Each is explained somewhere, but a seller sees four.
3. **The show page's "Sold here" list shows price + shipping charged** (the 1884-O Morgan shows $115.00; it sold for $110.00 plus $5.00 shipping) with no label.
4. **Show costs don't fit a stream.** The form offers Table fee, Gas / mileage, Hotel, Food, Other. For a Whatnot live only Food and Other make sense, so the ring light ($60) and mailers and bubble wrap ($25) went into one "Other" of $85, and the Schedule C summary calls it "Other show costs". No Supplies line.
5. **Refund or cancelled order: the only path is "Move back to collection".** It asked nothing, put the coin back in the collection and removed the sale from every report, so the Whatnot fee and shipping label already spent on that order disappeared from the totals. Undo is offered for a few seconds only. (The Kennedy was refunded as a test; final numbers below.)
6. **"Paid each" with a quantity.** Adding 20 junk quarters, the pretend seller typed the lot price ($24.50) into "Paid each". The app took it as each: cost $490 for the 20, so the 5 sold show cost $122.50 and a −$43.44 profit. Nothing on the form shows the lot total while typing.
7. **Sales CSV has no buyer, order number or tracking number** (those are in the coins CSV, which has no Show column). Neither CSV has a Business / Personal column (same as review 5).
8. **"Shipping you charged" has no usual value.** On Whatnot the buyer's shipping is a fixed amount for most orders, but it is typed on every sale. "Usual shipping cost" (what you pay) is per coin type only, not per package, and it was blank until the seller found it in Options → Selling.
9. **Home looks empty for a seller who only has Business stock.** Collection value $0.00, Coins 0, My Silver Stack 0.00 oz; the 27 items sit in the Business box lower down, while My Coins says "In collection (30)". It is by design, but a new seller will think the items didn't save.
10. **Many coins have no Red Book value**, so they price and value at melt: 1936-D Buffalo XF-45, 1907 Indian Head VF-20, 1944-D Lincoln MS-65, 1943-P Jefferson MS-64, 1946 Roosevelt MS-65, 1927 Standing Liberty VF-30, 1908-D Barber VF-20, 1938-D NGC Walker MS-65 (paid $95, valued $11.39) and 1945 PCGS Mercury MS-66 (paid $60, valued $2.28). The coin page says so, which is good, but Business stock reads Value $1,104.88 against Cost $1,602.50. **Check against your Red Book; nothing was guessed.**
11. Options → Seller Mode still says "and later dealer cases, shows and reports" and "Used on reports later" (same as review 5). A sold Whatnot coin page still shows "Check eBay sold ↗", and doesn't name the show it sold at.

## Business features looked for but not found
- **Sell several coins to one buyer as one order** (one shipping charge, one fee, one tracking number). Select has no Mark sold.
- **Stream costs by kind** (equipment, shipping supplies, subscriptions) that flow into the tax summary, instead of Table fee / Hotel / Gas.
- **A "to ship" list:** sold but not yet shipped / delivered, and a packing list by buyer after the stream.
- **A refund, cancel or return that keeps the record** (fee, shipping spent, coin back in stock).
- **A run sheet for tonight's stream:** pick which coins go in, lot number, starting bid, and a sell-through line ("put up 27, sold 10").
- **Usual shipping you charge** and shipping by package or weight tier.
- **Payout match-up:** compare Whatnot's payouts to the sales and fees recorded.
- **A buyer list:** repeat buyers, how much each bought, notes.
- **Giveaways and free items** (coin cost with no sale).
- **Auction vs buy-it-now** flag on a sale.
- **Price tags or flip labels** to print (carried over from review 5).

## Counts
Raw coin through the form: **11–12 taps/entries** (all sections opened, Business chosen). Slab: 14–15. Bar or round: 12. Roll: 12 (the coin type must be picked first). Proof set: 9. Setting up the Whatnot show: **8** entries. A sale with shipping charged, shipping paid, buyer, order, tracking and Card: **9 taps/entries** (7 when shipping charged is zero and nothing else is typed). After the stream the seller typed the same shipping, "Card" and Whatnot on nearly every sale.

## Final numbers after the 11th sale and the refund test
Items sold 14, sales $652.00, shipping charged $40.00, cost $460.50, fees $49.16, shipping paid $46.30, show costs $97.00, profit **$39.04**. Business stock at cost $1,619.50.

## Ranked wish list
1. **One order, several coins:** pick several Business coins, one buyer, one shipping charge, one order number, one tracking number, and one 30¢ fee (finding 1).
2. **Refund / cancel that keeps the record** instead of deleting the sale (finding 5).
3. **Stream costs by kind**, with a Supplies line on the Schedule C summary (finding 4).
4. **Make the sales and profit numbers agree** (or label each one) across Home, the show page, Sales Reports and the tax CSV (findings 2 and 3).
5. **Sales CSV with buyer, order and tracking; coins CSV with Show and Business / Personal** (finding 7).
6. **A usual "Shipping you charged"**, and shipping you paid by package, not only by coin type (finding 8).
7. **"Paid for the whole lot"** choice when Quantity is more than 1 (finding 6).
8. A **to-ship list** with a packing list by buyer.
9. A **stream run sheet** with sell-through.
10. Fill the Red Book gaps above (finding 10); small wording fixes (findings 9 and 11).
