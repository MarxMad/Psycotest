/**
 * Prueba de punta a punta de la sala en vivo, con Chrome real y cámara /
 * micrófono simulados. Requiere: `npm run livekit:dev` y `npm run dev`.
 *
 *   node --env-file=.env.local scripts/prueba-sala.mjs <carpeta-capturas> <id-clase>
 *
 * Entra como el primer admin de la base (anfitrión) y conecta una alumna de
 * prueba directo a LiveKit; la alumna no es un usuario de la base y no deja
 * registros. Lo único que se escribe es la asistencia del admin.
 */
import puppeteer from "puppeteer-core";
import { SignJWT } from "jose";
import postgres from "postgres";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const [CAPTURAS = ".", CLASE] = process.argv.slice(2);
if (!CLASE) throw new Error("Falta el id de la clase");
const B = process.env.PRUEBA_URL ?? "http://localhost:3000";
const SALA = `clase_${CLASE}`;
const K = process.env.LIVEKIT_API_KEY;
const SEC = process.env.LIVEKIT_API_SECRET;
const LK_HTTP = process.env.LIVEKIT_URL.replace(/^ws/, "http");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("•", ...a);

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require", max: 1 });
const [adm] = await sql`select id from users where rol = 'admin' limit 1`;
const cookie = await new SignJWT({ sub: adm.id, email: "x", nombre: "x", rol: "admin" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});

try {
  // ---------------------------------------------------------------- anfitrión
  const host = await (await browser.createBrowserContext()).newPage();
  await host.setViewport({ width: 1440, height: 900 });
  host.on("pageerror", (e) => log("ERROR en la página:", e.message));
  await host.setCookie({ name: "psycotest_session", value: cookie, domain: "localhost", path: "/" });
  await host.goto(`${B}/admin/clases-vivo/${CLASE}/sala`, { waitUntil: "networkidle2", timeout: 180000 });
  await host.waitForSelector("::-p-text(Abrir la clase)", { timeout: 120000 });
  await espera(2500);
  await host.screenshot({ path: `${CAPTURAS}/1-antesala.png` });
  log("antesala lista");

  await host.click("::-p-text(Abrir la clase)");
  await host.waitForSelector("::-p-text(En vivo)", { timeout: 60000 });
  await espera(4000);
  log("anfitrión conectado");

  // ---------------------------------------------------------------- alumna
  const at = new AccessToken(K, SEC, {
    identity: "invitado-prueba",
    name: "Alumna Prueba",
    attributes: { rol: "alumno" },
  });
  at.addGrant({
    room: SALA,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });
  const tok = await at.toJwt();
  const guest = await (await browser.createBrowserContext()).newPage();
  guest.on("pageerror", (e) => log("ERROR alumna:", e.message));
  await guest.goto(`${B}/api/auth/me`);
  const vistos = await guest.evaluate(
    async (tok, url) => {
      const lk = await import("https://cdn.jsdelivr.net/npm/livekit-client@2.23.0/+esm");
      const room = new lk.Room();
      window.__room = room;
      window.__recibidos = [];
      room.registerTextStreamHandler("lk.chat", async (reader) => {
        window.__recibidos.push(await reader.readAll());
      });
      await room.connect(url, tok);
      await room.localParticipant.enableCameraAndMicrophone();
      await room.localParticipant.setAttributes({ mano: "1" });
      await new Promise((r) => setTimeout(r, 1500));
      await room.localParticipant.sendText("Hola profe, ¿se escucha?", { topic: "lk.chat" });
      return room.numParticipants;
    },
    tok,
    process.env.LIVEKIT_URL,
  );
  log("alumna conectada; personas en la sala según ella:", vistos);

  await espera(6000);
  await host.screenshot({ path: `${CAPTURAS}/2-mosaico.png` });
  const texto = await host.evaluate(() => document.body.innerText);
  log("el anfitrión ve a la alumna:", texto.includes("Alumna Prueba"));
  log("mano levantada visible:", (await host.$$('[aria-label="Levantó la mano"]')).length > 0);
  log("contador de chat sin leer:", await host.$eval('[aria-label="Chat"]', (b) => b.innerText.trim()));

  // ---------------------------------------------------------------- chat
  await host.click('[aria-label="Chat"]');
  await espera(800);
  log("mensaje de la alumna en el chat:", (await host.evaluate(() => document.body.innerText)).includes("Hola profe"));
  await host.type('input[aria-label="Mensaje"]', "Sí, fuerte y claro");
  await host.keyboard.press("Enter");
  await espera(2000);
  await host.screenshot({ path: `${CAPTURAS}/3-chat.png` });
  log("la alumna recibió la respuesta:", await guest.evaluate(() => window.__recibidos.includes("Sí, fuerte y claro")));

  // ---------------------------------------------------------------- moderación
  await host.click('[aria-label="Personas"]');
  await espera(800);
  await host.screenshot({ path: `${CAPTURAS}/4-personas.png` });
  const svc = new RoomServiceClient(LK_HTTP, K, SEC);
  const alumna = async () => (await svc.listParticipants(SALA)).find((p) => p.identity === "invitado-prueba");

  await host.click("::-p-text(Silenciar a todos)");
  await espera(2500);
  log("micrófono de la alumna silenciado:", (await alumna())?.tracks.find((t) => t.source === 2)?.muted === true);

  await host.click("::-p-text(Bajar mano)");
  await espera(2000);
  log("mano bajada por el anfitrión:", !(await alumna())?.attributes?.mano);

  // ---------------------------------------------------------------- teléfono y pizarra
  await host.setViewport({ width: 390, height: 844 });
  await espera(1500);
  await host.screenshot({ path: `${CAPTURAS}/5-telefono.png` });
  await host.setViewport({ width: 1440, height: 900 });
  await espera(800);
  await host.click('[aria-label="Cerrar panel"]');
  await host.click('[aria-label="Pizarra"]');
  await espera(7000);
  await host.screenshot({ path: `${CAPTURAS}/6-pizarra.png` });

  // ---------------------------------------------------------------- salida
  await guest.evaluate(() => window.__room.disconnect());
  await host.click('[aria-label="Salir de la sala"]');
  await host.waitForSelector("::-p-text(Saliste de la clase)", { timeout: 20000 });
  await host.screenshot({ path: `${CAPTURAS}/7-salida.png` });
  log("salida explicada");

  await espera(3000);
  const filas = await sql`
    select joined_at, left_at, connected_seconds, presence_percent
    from live_class_attendances where live_class_id = ${CLASE} and user_id = ${adm.id}`;
  log("filas de asistencia del admin:", filas.length, JSON.stringify(filas.at(-1)));
  const [cl] = await sql`select status, provider, room_url from live_classes where id = ${CLASE}`;
  log("clase:", JSON.stringify(cl));
} finally {
  await browser.close();
  await sql.end();
}
