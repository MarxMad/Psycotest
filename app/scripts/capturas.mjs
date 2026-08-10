/**
 * Captura las pantallas reales de la plataforma para la propuesta.
 *
 *   node scripts/capturas.mjs        (con el servidor corriendo en :3100)
 *
 * Usa el Chrome instalado en el sistema, así que no descarga navegador.
 */

import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3100";
const SALIDA = "capturas";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Orden de los ítems de la Parte I que produce ocho disimilitudes. */
const PROTOCOLO_INVALIDO = [6, 9, 10, 11, 13, 5, 4, 3, 12, 17, 15, 2, 18, 14, 8, 1, 16, 7];
/** Ordenamiento razonable, cercano a la norma. */
const PROTOCOLO_VALIDO = [5, 9, 11, 10, 13, 6, 17, 16, 12, 3, 1, 18, 2, 15, 8, 14, 4, 7];

async function nueva(browser, ancho = 1440, alto = 900) {
  const p = await browser.newPage();
  await p.setViewport({ width: ancho, height: alto, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  return p;
}

async function foto(page, nombre, opts = {}) {
  await esperar(450);
  await page.screenshot({ path: `${SALIDA}/${nombre}.png`, ...opts });
  console.log(`  ✓ ${nombre}.png`);
}

/** Hace clic en el primer botón cuyo texto contenga `txt`. Devuelve si lo encontró. */
async function clic(page, txt) {
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(t));
    if (!b) return false;
    b.click();
    return true;
  }, txt);
  if (!ok) throw new Error(`no se encontró el botón «${txt}»`);
  await esperar(420);
  return ok;
}

/** Asigna el ranking `orden[i]` al ítem i usando el botón «asignar n» de cada fila. */
async function ordenar(page, orden, hasta = 18) {
  await page.waitForSelector('[data-idx="0"]');
  for (let n = 1; n <= hasta; n++) {
    const idx = orden.indexOf(n);
    const ok = await page.evaluate((k) => {
      const b = document.querySelector(`[data-idx="${k}"] [data-accion="asignar"]`);
      if (!b) return false;
      b.click();
      return true;
    }, idx);
    if (!ok) throw new Error(`no se pudo asignar el ${n} al ítem ${idx}`);
    await esperar(35);
  }
}

/** Falla ruidosamente si la pantalla no es la esperada. */
async function comprobar(page, texto, donde) {
  // innerText devuelve el texto ya transformado por CSS, así que comparamos sin distinguir caja
  const hay = await page.evaluate(
    (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
    texto,
  );
  if (!hay) throw new Error(`${donde}: no aparece «${texto}» en pantalla`);
}

const main = async () => {
  await mkdir(SALIDA, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--force-device-scale-factor=2", "--hide-scrollbars"],
  });

  // ---------- inicio ----------
  let page = await nueva(browser);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await foto(page, "01-inicio");

  // ---------- PAPI: instrucciones ----------
  await page.goto(`${BASE}/papi`, { waitUntil: "networkidle0" });
  await foto(page, "02-papi-instrucciones", { fullPage: true });

  // ---------- PAPI: aplicación ----------
  await page.type("#p", "Abraham González de la Rosa");
  await page.type("#pu", "Gerente comercial");
  await page.type("#em", "Comerciando");
  await clic(page, "Comenzar la aplicación");
  await foto(page, "03-papi-aplicacion");

  // responder los 90 pares, esperando a que avance el contador tras cada uno
  const contador = () =>
    page.evaluate(() => {
      const m = document.body.innerText.match(/Par (\d+) de 90/);
      return m ? Number(m[1]) : null;
    });
  for (let k = 1; k <= 90; k++) {
    await page.keyboard.press(k % 3 === 0 ? "b" : "a");
    if (k === 90) break;
    for (let t = 0; t < 40; t++) {
      await esperar(40);
      if ((await contador()) === k + 1) break;
    }
  }
  await esperar(1200);
  await comprobar(page, "Calificación", "04 perfil");
  await foto(page, "04-papi-perfil", { fullPage: true });
  await page.close();

  // ---------- Hartman: ordenamiento ----------
  page = await nueva(browser);
  await page.goto(`${BASE}/hartman`, { waitUntil: "networkidle0" });
  await page.type("#nombre", "Abraham González de la Rosa");
  await page.type("#edad", "34");
  await page.type("#ocu", "Gerente comercial");
  await clic(page, "Comenzar con la Parte I");
  await clic(page, "ocultar instrucciones");
  await ordenar(page, PROTOCOLO_VALIDO, 8);   // a medio llenar, para que se vea el estado
  await comprobar(page, "de 18 asignados", "05 ordenamiento");
  await foto(page, "05-hartman-ordenamiento", { fullPage: true });

  // completar Parte I y Parte II con un protocolo válido
  await page.reload({ waitUntil: "networkidle0" });
  await page.type("#nombre", "Abraham González de la Rosa");
  await clic(page, "Comenzar con la Parte I");
  await clic(page, "ocultar instrucciones");
  await ordenar(page, PROTOCOLO_VALIDO);
  await clic(page, "Continuar a la Parte II");
  await clic(page, "ocultar instrucciones");
  await ordenar(page, PROTOCOLO_VALIDO);
  await clic(page, "Ver calificación");
  await comprobar(page, "Calificación", "06 resultados");
  await foto(page, "06-hartman-resultados", { fullPage: true });
  await page.close();

  // ---------- Hartman: protocolo bloqueado ----------
  page = await nueva(browser, 1440, 760);
  await page.goto(`${BASE}/hartman`, { waitUntil: "networkidle0" });
  await page.type("#nombre", "Protocolo de ejemplo");
  await clic(page, "Comenzar con la Parte I");
  await clic(page, "ocultar instrucciones");
  await ordenar(page, PROTOCOLO_INVALIDO);
  await clic(page, "Continuar a la Parte II");
  await clic(page, "ocultar instrucciones");
  await ordenar(page, PROTOCOLO_VALIDO);
  await clic(page, "Ver calificación");
  await comprobar(page, "no se interpreta", "07 bloqueado");
  await foto(page, "07-hartman-bloqueado");

  await browser.close();
  console.log("\nlisto");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
