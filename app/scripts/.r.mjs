import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://psicologia.localhost:3100/", { waitUntil: "networkidle0", timeout: 120000 });

const estado = () => p.evaluate(() => {
  const svg = document.querySelector("svg[aria-label*='cinco instrumentos']");
  if (!svg) return null;
  const q = (s) => [...svg.querySelectorAll(s)].map(n => +(+getComputedStyle(n).opacity).toFixed(2));
  const puesto = svg.querySelector("[data-perfil='puesto']");
  return {
    anillos: q("[data-anillo]"),
    puesto: +(+getComputedStyle(puesto).opacity).toFixed(2),
    dash: getComputedStyle(puesto).strokeDasharray,
    etiquetas: q("[data-etiqueta]"),
  };
});

console.log("antes de verlo :", JSON.stringify(await estado()));
await p.evaluate(() => document.querySelector("svg[aria-label*='cinco instrumentos']").scrollIntoView({ block: "center" }));
const muestras = [];
for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 200)); muestras.push({ t: (i+1)*200, ...(await estado()) }); }
for (const m of muestras.slice(0, 6)) console.log(`  ${String(m.t).padStart(4)}ms anillos=${JSON.stringify(m.anillos)} puesto=${m.puesto} dash=${m.dash?.slice(0,22)}`);
const fin = muestras.at(-1);
console.log("al final        :", JSON.stringify({ anillos: fin.anillos, puesto: fin.puesto, etiquetas: fin.etiquetas }));
console.log("errores:", errs.length ? errs : "ninguno");
await b.close();
