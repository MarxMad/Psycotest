import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/tmp/claude-501/-Users-gerryvela-Documents-PsycoTest/102d215a-d2f9-4e0e-9ac1-471d2667792e/scratchpad";
const [url, name, sel, w = "1440", h = "900"] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: sel ? 2 : 1 });
p.on("pageerror", e => console.log("PAGE ERROR:", e.message));
await p.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
await p.evaluate(async () => { const H = document.body.scrollHeight; for (let y = 0; y < H; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } window.scrollTo(0, 0); });
await new Promise(r => setTimeout(r, 1400));
if (sel) { const el = await p.$(sel); if (!el) { console.log("no encontrado", sel); process.exit(1); } await el.scrollIntoView(); await new Promise(r => setTimeout(r, 1200)); await el.screenshot({ path: `${OUT}/${name}.png` }); }
else await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
console.log("ok");
await b.close();
