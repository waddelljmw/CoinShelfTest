// Runs every test in this folder and prints a short summary.
// Usage: node tests/run-all.js            (all tests)
//        node tests/run-all.js wants rb   (only the named tests)
// A test fails if it prints "FAIL", crashes, or reports page errors.
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");

const dir = __dirname;
const pick = process.argv.slice(2);
const tests = fs.readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "run-all.js").map((f) => f.replace(/\.js$/, "")).filter((t) => !pick.length || pick.includes(t)).sort();
let bad = 0;
for (const t of tests) {
  let out = "";
  try { out = execFileSync("node", [path.join(dir, t + ".js")], { encoding: "utf8", timeout: 120000, stdio: ["ignore", "pipe", "pipe"] }); }
  catch (e) { out = (e.stdout || "") + (e.stderr || "") + "\nCRASHED"; }
  const fails = out.split("\n").filter((l) => /^FAIL|CRASHED|Error:|TimeoutError/.test(l));
  const pageErr = /errors \[\s*\S/.test(out.replace(/errors \[\]/g, ""));
  if (fails.length || pageErr) { bad++; console.log("✗ " + t); fails.slice(0, 5).forEach((l) => console.log("    " + l)); if (pageErr) console.log("    page errors reported"); }
  else console.log("✓ " + t);
}
console.log(`\n${tests.length - bad} of ${tests.length} tests passed.`);
process.exit(bad ? 1 : 0);
