import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/tmp/claude-501/-Users-gerryvela-Documents-PsycoTest/102d215a-d2f9-4e0e-9ac1-471d2667792e/scratchpad";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", e => errs.push(e.message));

await p.goto("http://psicologia.localhost:3100/", { waitUntil: "domcontentloaded", timeout: 120000 });
// titular palabra por palabra
const m = await p.evaluate(async () => {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const w = [...document.querySelectorAll("h1 .word, h1 span")].slice(0, 5).map(n => +(+getComputedStyle(n).opacity).toFixed(2));
    out.push(w);
    await new Promise(r => setTimeout(r, 90));
  }
  return out;
});
console.log("titular, opacidad por palabra:");
for (const x of m.slice(1, 5)) console.log("  ", JSON.stringify(x));
console.log("¿escalonado?:", m.some(x => new Set(x).size > 1));

await new Promise(r => setTimeout(r, 1500));
console.log("puertas:", await p.$$eval("[data-puerta]", ns => ns.map(n => n.querySelector("strong").textContent)));
await p.screenshot({ path: `${OUT}/psico-portada.png` });

// barra fija
await p.evaluate(() => window.scrollTo(0, 2400));
await new Promise(r => setTimeout(r, 900));
const barra = await p.evaluate(() => {
  const b = document.querySelector('[aria-label="Acciones rápidas"]');
  return b ? { visible: b.dataset.visible, tema: b.dataset.tema, texto: b.innerText.replace(/\n/g, " · ") } : null;
});
console.log("barra:", JSON.stringify(barra));
console.log("errores:", errs.length ? errs : "ninguno");
await b.close();
