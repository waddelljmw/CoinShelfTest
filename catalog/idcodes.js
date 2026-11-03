/* Coin ID codes (Step 7.0). One short code per coin type; the ID is code + number, e.g. MD-012.
   Change any code here. Two letters/digits each, and every code must be different. */
const ID_CODES = {
  "flying-eagle-cent": "FE", "indian-cent": "IC", "lincoln-wheat": "LW", "lincoln-memorial-copper": "LM", "lincoln-memorial-zinc": "LZ",
  "lincoln-bicentennial": "LB", "lincoln-shield": "LS", "shield-nickel": "SN", "liberty-nickel": "LN", "buffalo-nickel": "BN",
  "jefferson-nickel": "JN", "jefferson-war-nickel": "JW", "barber-dime": "BD", "mercury-dime": "ME", "roosevelt-silver": "RS",
  "roosevelt-clad": "RC", "barber-quarter": "BQ", "standing-liberty-quarter": "SL", "washington-silver": "WS", "washington-clad": "WC",
  "state-quarter": "SQ", "atb-quarter": "AQ", "women-quarter": "WQ", "barber-half": "BH", "walking-liberty-half": "WH",
  "franklin-half": "FH", "kennedy-90": "K9", "kennedy-40": "K4", "kennedy-clad": "KC", "morgan-dollar": "MD", "peace-dollar": "PD",
  "morgan-modern": "MM", "peace-modern": "PM", "ike-clad": "EC", "ike-40": "E4", "sba-dollar": "SB", "sacagawea-dollar": "SD",
  "presidential-dollar": "PR", "silver-commem-dollar": "CD", "silver-eagle": "SE", "gold-eagle-1": "G1", "gold-eagle-half": "G2",
  "gold-eagle-quarter": "G4", "gold-eagle-tenth": "GT", "gold-buffalo": "GB", "platinum-eagle": "PE", "gold-dollar": "GD",
  "liberty-2-5": "L2", "indian-2-5": "I2", "liberty-5": "L5", "indian-5": "I5", "liberty-10": "LX", "indian-10": "IX",
  "liberty-20": "LT", "saint-gaudens-20": "SG",
};
// Things that are not a catalog coin type.
const ID_CODES_OTHER = { bar: "BR", round: "RD", silverItem: "OS", set: "ST", roll: "RL", medal: "MT", foreign: "FC", coin: "OC" };
