// Errors and problems: lists for the coin form.
// KNOWN_VARIETIES: well-documented die varieties (listed in the Red Book, the Cherrypickers' Guide, PCGS or NGC).
// Only add ones confirmed from a real source or Red Book pages; never guess.
// Each entry: [year, mint, name] or [year, mint, name, design]. mint "" = Philadelphia (no mint mark); null = any mint.
// design is for series with several designs a year (e.g. the state on a 50 States quarter).
// Varieties that already have their own Red Book price row are picked in the Variety box instead (e.g. Washington quarter doubled dies).
const KNOWN_VARIETIES = {
  "lincoln-wheat": [
    [1917, "", "Doubled Die Obverse"], [1922, null, "No D"], [1936, "", "Doubled Die Obverse"],
    [1955, "", "Doubled Die Obverse"], [1958, "", "Doubled Die Obverse"],
  ],
  "lincoln-memorial-copper": [
    [1969, "S", "Doubled Die Obverse"], [1970, "S", "Doubled Die Obverse"], [1971, "", "Doubled Die Obverse"], [1972, "", "Doubled Die Obverse"],
  ],
  "lincoln-memorial-zinc": [
    [1983, "", "Doubled Die Reverse"], [1984, "", "Doubled Ear"], [1990, null, "No S (proof)"], [1992, "", "Close AM"], [1992, "D", "Close AM"],
    [1995, "", "Doubled Die Obverse"], [1998, "", "Wide AM"], [1999, "", "Wide AM"], [2000, "", "Wide AM"],
  ],
  "buffalo-nickel": [[1916, "", "Doubled Die Obverse"], [1918, "D", "8 Over 7"], [1937, "D", "3-Legged"]],
  "jefferson-nickel": [[1939, "", "Doubled Monticello (Doubled Die Reverse)"], [1949, "D", "D Over S"], [1954, "S", "S Over D"], [1955, "D", "D Over S"]],
  "jefferson-war-nickel": [[1943, "P", "3 Over 2"]],
  "mercury-dime": [[1942, "", "2 Over 1"], [1942, "D", "2 Over 1"]],
  "roosevelt-clad": [[1982, "", "No P"]],
  "kennedy-90": [[1964, null, "Accented Hair (proof)"]],
  "kennedy-clad": [[1974, "D", "Doubled Die Obverse"]],
  "state-quarter": [
    [1999, "", "Spitting Horse (die crack)", "Delaware"],
    [2004, "D", "Extra Leaf High", "Wisconsin"], [2004, "D", "Extra Leaf Low", "Wisconsin"],
    [2005, "", "Doubled Die Reverse (Extra Tree)", "Minnesota"],
    [2005, null, "\"In God We Rust\" (filled die)", "Kansas"],
  ],
};
// Mistakes made while striking the coin (they can add value).
const MINT_ERRORS = ["Off-center", "Clipped planchet", "Double struck", "Broadstrike", "Wrong planchet", "Struck through", "Die cap", "Brockage", "Die break or cud", "Lamination", "Missing clad layer", "Other"];
// Damage after it left the Mint. Any of these makes it a "Details" coin, worth less than the Red Book price.
const COIN_PROBLEMS = ["Cleaned", "Scratched", "Holed", "Bent", "Corroded", "Environmental damage", "Polished", "Tooled", "Repaired", "Rim damage", "Other"];
// Ways a coin can be gone from the collection without being sold.
const GONE_REASONS = ["Traded", "Gifted", "Lost", "Spent", "Other"];
// How a purchase was paid for.
const PAY_METHODS = ["Cash", "Card", "PayPal", "Check", "Venmo", "Zelle", "Trade", "Other"];
