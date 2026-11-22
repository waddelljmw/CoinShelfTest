const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => JSON.stringify([
    certUrl({ gradeMode: "cert", service: "PCGS", cert: "45123987", grade: "MS-64" }),
    certUrl({ gradeMode: "cert", service: "NGC", cert: "6066357-002", grade: "MS-68" }),
    certUrl({ gradeMode: "cert", service: "NGC", cert: "6123456-001", grade: "Other", customGrade: "AU Details" }),
    certUrl({ gradeMode: "cert", service: "ANACS", cert: "123", grade: "VF-20" }),
    certUrl({ gradeMode: "raw", service: "PCGS", cert: "45123987", grade: "VF-20" }),
    certUrl({ gradeMode: "cert", service: "PCGS", cert: "", grade: "MS-64" }),
  ], null, 1)));
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=mint]", "S"); await p.click("[data-act=gmode][data-v=cert]");
  await p.selectOption("[data-f=service]", "NGC"); await p.fill("[data-f=cert]", "6066357-002"); await p.selectOption("[data-f=grade]", "MS-65");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  const a = p.locator("a:has-text('Verify cert')");
  console.log("button:", (await a.textContent()).trim(), await a.getAttribute("href"), await a.getAttribute("target"));
  await p.screenshot({ path: "/tmp/cert.png" });
  console.log("errors", errors); await b.close();
})();
