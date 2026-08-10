#!/usr/bin/env python3
"""Genera el deck de presentación con las capturas incrustadas."""

import json, pathlib

IMG = json.loads(pathlib.Path("capturas/slides.json").read_text())
DEST = pathlib.Path(
    "/private/tmp/claude-501/-Users-gerryvela-Documents-PsycoTest/"
    "69f7fc87-8d2c-43b0-acf5-1bc3ba7106f1/scratchpad/presentacion.html"
)


def img(nombre, alt):
    return f'<img src="data:image/jpeg;base64,{IMG[nombre]}" alt="{alt}">'


SLIDES = [
    # ---------- 1 · portada ----------
    f"""<section class="s portada">
  <div class="pTop">
    <span class="eyebrow">Propuesta de desarrollo</span>
    <h1>Plataforma de<br>evaluación psicológica</h1>
    <p class="lede">Aplicación, calificación e interpretación de sus tres instrumentos,
      en un sistema propio.</p>
  </div>
  <div class="pBot">
    <div class="tres">
      <span>PAPI</span><i></i><span>Hartman</span><i></i><span>MABE</span>
    </div>
    <span class="quiet">Julio 2026</span>
  </div>
</section>""",

    # ---------- 2 · el problema ----------
    """<section class="s">
  <span class="eyebrow">El punto de partida</span>
  <h2>Calificar un protocolo a mano<br>toma <em>86 operaciones</em>.</h2>
  <div class="cols2">
    <p>Comparar los dieciocho valores contra la norma, asignarles signo, aplicar el ajuste,
      sumar positivos y negativos por eje, contar las disimilitudes. Después buscar cada
      resultado en la tabla de perfil y redactar el informe.</p>
    <p class="acc"><strong>Y un error aritmético no avisa.</strong> Produce un número creíble,
      dentro de rango, que termina impreso en un informe firmado.</p>
  </div>
</section>""",

    # ---------- 3 · la plataforma ----------
    f"""<section class="s shot">
  <div class="shotHead">
    <span class="eyebrow">La plataforma</span>
    <h3>Ya está funcionando. Puede probarla hoy.</h3>
  </div>
  <figure>{img("01-inicio", "Pantalla de inicio con las tres pruebas")}</figure>
</section>""",

    # ---------- 4 · instrucciones ----------
    f"""<section class="s shot">
  <div class="shotHead">
    <span class="eyebrow">Aplicación · 1</span>
    <h3>Las instrucciones de cada prueba, tomadas de sus manuales.</h3>
  </div>
  <figure>{img("02-papi-instrucciones", "Instrucciones del PAPI en pantalla")}</figure>
</section>""",

    # ---------- 5 · captura ----------
    f"""<section class="s shot">
  <div class="shotHead">
    <span class="eyebrow">Aplicación · 2</span>
    <h3>Se captura sin errores posibles.</h3>
  </div>
  <div class="duo">
    <figure>
      {img("03-papi-aplicacion", "Aplicación del PAPI par por par")}
      <figcaption>Un par a la vez. Guarda cada respuesta; se puede interrumpir y retomar.</figcaption>
    </figure>
    <figure>
      {img("05-hartman-ordenamiento", "Ordenamiento del Hartman")}
      <figcaption>La suma corre en pantalla. No deja avanzar si algo falta o se repite.</figcaption>
    </figure>
  </div>
</section>""",

    # ---------- 6 · perfil PAPI ----------
    f"""<section class="s shot">
  <div class="shotHead">
    <span class="eyebrow">Calificación · PAPI</span>
    <h3>La hoja de perfil, dibujada como la lámina que usted conoce.</h3>
  </div>
  <figure>{img("04-papi-perfil", "Hoja de perfil del PAPI")}</figure>
</section>""",

    # ---------- 7 · resultados Hartman ----------
    f"""<section class="s shot">
  <div class="shotHead">
    <span class="eyebrow">Calificación · Hartman</span>
    <h3>Cada indicador con su nivel y su significado.</h3>
  </div>
  <figure>{img("06-hartman-resultados", "Resultados del Hartman")}</figure>
</section>""",

    # ---------- 8 · la puerta de validez ----------
    """<section class="s">
  <span class="eyebrow">Una diferencia que importa</span>
  <h2>El sistema se niega a interpretar<br>lo que no debe.</h2>
  <p class="sub">Con <strong>seis o más disimilitudes</strong>, el Inventario Hartman establece que
    el protocolo no se interpreta. Así se ve un caso real:</p>
  <div class="tabla">
    <div class="tr th"><span>enunciado</span><span>norma</span><span>respuesta</span></div>
    <div class="tr"><span>Un bebé</span><span>1</span><span class="mal">15</span></div>
    <div class="tr"><span>Amor por la naturaleza</span><span>2</span><span class="mal">18</span></div>
    <div class="tr"><span>Un genio matemático</span><span>3</span><span class="mal">16</span></div>
    <div class="tr"><span>Torturar a una persona</span><span>18</span><span class="mal">2</span></div>
    <div class="tr"><span>Esclavitud</span><span>15</span><span class="mal">1</span></div>
  </div>
  <p class="pie">Su ordenamiento está <em>invertido</em> respecto a la escala del instrumento.
    Los índices se calcularían contra una norma con la que el protocolo ya no guarda relación.</p>
</section>""",

    # ---------- 9 · bloqueado ----------
    f"""<section class="s shot">
  <div class="shotHead">
    <span class="eyebrow">Validez</span>
    <h3>Una hoja de cálculo suma lo que le den. Esto no.</h3>
  </div>
  <figure>{img("07-hartman-bloqueado", "Protocolo bloqueado por disimilitudes")}</figure>
</section>""",

    # ---------- 10 · el panel ----------
    """<section class="s">
  <span class="eyebrow">Mes 2</span>
  <h2>Su panel de revisión.</h2>
  <div class="grid3">
    <div><h4>Listado de aplicaciones</h4><p>Filtrable por participante, prueba, fecha y estado:
      en captura, calificada o aprobada.</p></div>
    <div><h4>Detalle de resultados</h4><p>Puntajes, gráficas y el desglose reactivo por reactivo,
      con las discrepancias marcadas.</p></div>
    <div><h4>Revisión y firma</h4><p>Edita el borrador, agrega sus notas y aprueba.
      Desde ahí el informe queda inmutable.</p></div>
    <div><h4>Historial</h4><p>Todas las pruebas de una misma persona en un solo expediente.</p></div>
    <div><h4>Perfiles de acceso</h4><p>El aplicador captura; usted interpreta y firma.</p></div>
    <div><h4>Bitácora</h4><p>Quién hizo qué y cuándo, con la versión exacta de claves y normas.</p></div>
  </div>
</section>""",

    # ---------- 11 · su criterio ----------
    """<section class="s">
  <span class="eyebrow">Lo que no cambia</span>
  <h2>La decisión clínica<br>sigue siendo suya.</h2>
  <div class="cols3">
    <div><span class="n">01</span><h4>El informe nunca se emite solo</h4>
      <p>Todo texto sale marcado como borrador. Se cierra únicamente con su aprobación y firma.</p></div>
    <div><span class="n">02</span><h4>Nada cambia hacia atrás</h4>
      <p>Un ajuste posterior no altera un informe ya firmado. Si hace falta, se genera uno nuevo.</p></div>
    <div><span class="n">03</span><h4>Datos protegidos</h4>
      <p>Acceso restringido, cifrado, consentimiento por sesión y respaldos automáticos.</p></div>
  </div>
</section>""",

    # ---------- 11b · la plataforma crece ----------
    """<section class="s">
  <span class="eyebrow">Más allá de las tres</span>
  <h2>Un solo lugar para<br>todas sus pruebas.</h2>
  <p class="sub">La plataforma no se construyó alrededor de un instrumento, sino alrededor de
    tres formas de responder: <strong>elección forzada</strong>, <strong>ordenamiento</strong> y
    <strong>escala de puntuación</strong>. Entre las tres cubren la mayoría de los inventarios
    que se aplican en selección y desarrollo.</p>
  <div class="cols3">
    <div><span class="n">HOY</span><h4>PAPI · Hartman · MABE</h4>
      <p>Los tres instrumentos completos, con sus claves, sus normas y sus textos.</p></div>
    <div><span class="n">DESPUÉS</span><h4>La que usted decida</h4>
      <p>Incorporar un instrumento nuevo es cargar sus reactivos, su clave y sus textos —
        no reconstruir la plataforma.</p></div>
    <div><span class="n">SIEMPRE</span><h4>Un expediente por persona</h4>
      <p>Todas las pruebas de un mismo participante en un solo lugar, con su historial completo.</p></div>
  </div>
</section>""",

    # ---------- 12 · calendario ----------
    """<section class="s">
  <span class="eyebrow">Calendario</span>
  <h2>Tres meses. Tres entregas.</h2>
  <div class="meses">
    <div class="mes m1">
      <span class="mNum">Mes 1</span>
      <h4>Captura y validación</h4>
      <p>La metodología de las tres pruebas validada contra sus propios protocolos.
        La plataforma capturando y guardando, con usuarios y perfiles.</p>
    </div>
    <div class="mes m2">
      <span class="mNum">Mes 2</span>
      <h4>Calificación y panel</h4>
      <p>Las tres pruebas calificándose solas desde las respuestas,
        y el panel para revisarlas y aprobarlas.</p>
    </div>
    <div class="mes m3">
      <span class="mNum">Mes 3</span>
      <h4>Informes y puesta en marcha</h4>
      <p>Gráficas, informes completos en PDF, y el sistema instalado
        y en uso en su consultorio.</p>
    </div>
  </div>
  <p class="pie">Al cerrar cada mes hay algo funcionando que usted prueba antes de liberar el pago siguiente.</p>
</section>""",

    # ---------- 13 · inversión ----------
    """<section class="s inv">
  <span class="eyebrow">Inversión</span>
  <div class="precio">
    <span class="big">$15,000</span>
    <span class="cur">MXN · IVA no incluido</span>
  </div>
  <div class="pagos">
    <div><span class="pWhen">Al firmar</span><span class="pAmt">$5,000</span></div>
    <div><span class="pWhen">A 30 días</span><span class="pAmt">$5,000</span></div>
    <div><span class="pWhen">A 60 días</span><span class="pAmt">$5,000</span></div>
  </div>
  <p class="pie"><strong>Precio de introducción de primer proyecto.</strong> Cubre el alcance completo:
    los tres instrumentos, el panel y la puesta en marcha. Sin cobros adicionales por desarrollo.</p>
</section>""",

    # ---------- 14 · qué necesito ----------
    """<section class="s">
  <span class="eyebrow">Para empezar</span>
  <h2>Lo que necesito de usted.</h2>
  <ol class="pasos">
    <li><span class="i">1</span><div><h4>Un protocolo ya calificado a mano de cada prueba</h4>
      <p>Con las respuestas y los resultados. Es la referencia contra la que se verifica
        que el sistema califique exactamente igual que usted.</p></div></li>
    <li><span class="i">2</span><div><h4>Tres sesiones de dos horas</h4>
      <p>A lo largo del proyecto, para firmar las claves de calificación y validar los
        resultados contra su propio criterio.</p></div></li>
    <li><span class="i">3</span><div><h4>Qué otras pruebas aplica</h4>
      <p>La plataforma está hecha para concentrarlas. Dígame cuáles usa y las vamos
        incorporando conforme las necesite.</p></div></li>
  </ol>
</section>""",

    # ---------- 15 · cierre ----------
    """<section class="s cierre">
  <h2>El trabajo difícil<br>ya está hecho.</h2>
  <p class="lede">Las reglas de calificación de los tres instrumentos fueron reconstruidas y
    verificadas antes de iniciar. La plataforma ya captura y califica.</p>
  <p class="lede acc">Lo que sigue es conectarla a su consultorio.</p>
  <div class="tres cierreTres">
    <span>PAPI</span><i></i><span>Hartman</span><i></i><span>MABE</span>
    <i></i><span class="mas">y las que vengan</span>
  </div>
</section>""",
]

CSS = """
:root {
  --ink:#191b1f; --ink-soft:#3c4148; --muted:#6d7278; --faint:#9a9ea3;
  --paper:#f4f4f0; --surface:#fcfcfa; --rule:#dcdcd4; --rule-soft:#e9e9e2;
  --papi:#3e5a6e; --hartman:#3d6d5b; --mabe:#8d6a1c; --alert:#8c3b2e;
  --serif:Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root{
  --ink:#e8e8e3; --ink-soft:#c4c5c2; --muted:#8f9499; --faint:#6a6f75;
  --paper:#131518; --surface:#1b1e22; --rule:#33373d; --rule-soft:#262a2f;
  --papi:#8db1cb; --hartman:#79b59c; --mabe:#cba852; --alert:#d08272;
}}
:root[data-theme=light]{
  --ink:#191b1f; --ink-soft:#3c4148; --muted:#6d7278; --faint:#9a9ea3;
  --paper:#f4f4f0; --surface:#fcfcfa; --rule:#dcdcd4; --rule-soft:#e9e9e2;
  --papi:#3e5a6e; --hartman:#3d6d5b; --mabe:#8d6a1c; --alert:#8c3b2e;
}
:root[data-theme=dark]{
  --ink:#e8e8e3; --ink-soft:#c4c5c2; --muted:#8f9499; --faint:#6a6f75;
  --paper:#131518; --surface:#1b1e22; --rule:#33373d; --rule-soft:#262a2f;
  --papi:#8db1cb; --hartman:#79b59c; --mabe:#cba852; --alert:#d08272;
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--sans);
  line-height:1.55;-webkit-font-smoothing:antialiased;overflow:hidden}
ul,ol{list-style:none}

/* ---------- escenario ---------- */
.deck{position:fixed;inset:0}
.s{position:absolute;inset:0;display:none;flex-direction:column;justify-content:center;
  padding:clamp(38px,6vh,80px) clamp(28px,6vw,110px) clamp(64px,8vh,96px);
  gap:clamp(14px,2.2vh,26px);opacity:0}
.s.on{display:flex;animation:entra .42s cubic-bezier(.22,1,.36,1) forwards}
@keyframes entra{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.s.on{animation:none;opacity:1}}

h1,h2,h3,h4{font-family:var(--serif);font-weight:400;text-wrap:balance;line-height:1.1}
h1{font-size:clamp(38px,6.6vw,80px);letter-spacing:-.02em}
h2{font-size:clamp(30px,5vw,62px);letter-spacing:-.018em;line-height:1.08}
h3{font-size:clamp(20px,2.6vw,34px);letter-spacing:-.01em}
h4{font-size:clamp(16px,1.5vw,20px);margin-bottom:6px}
em{font-style:normal;color:var(--alert)}
p{font-size:clamp(15px,1.35vw,20px);color:var(--ink-soft);max-width:60ch}
strong{color:var(--ink);font-weight:600}
.eyebrow{font-family:var(--mono);font-size:clamp(10px,.85vw,12.5px);
  letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.quiet{font-family:var(--mono);font-size:12px;color:var(--faint);letter-spacing:.05em}
.lede{font-family:var(--serif);font-size:clamp(18px,2.1vw,28px);line-height:1.42;
  color:var(--ink-soft);max-width:34ch}
.acc strong,.acc{color:var(--ink)}
.sub{max-width:62ch}
.pie{font-size:clamp(13px,1.1vw,16px);color:var(--muted);max-width:70ch;margin-top:4px}

/* ---------- portada ---------- */
.portada{justify-content:space-between}
.pTop{display:flex;flex-direction:column;gap:clamp(14px,2vh,24px);margin-top:auto}
.pBot{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:auto;
  padding-top:clamp(20px,3vh,34px);border-top:1px solid var(--rule)}
.tres{display:flex;align-items:center;gap:clamp(10px,1.6vw,20px);font-family:var(--serif);
  font-size:clamp(15px,1.6vw,22px)}
.tres i{width:4px;height:4px;border-radius:50%;background:var(--muted);display:inline-block}
.tres span:nth-of-type(1){color:var(--papi)}
.tres span:nth-of-type(2){color:var(--hartman)}
.tres span:nth-of-type(3){color:var(--mabe)}
.tres .mas{color:var(--faint);font-family:var(--sans);font-size:clamp(12px,1.05vw,15px);font-style:italic}

/* ---------- capturas ---------- */
.shot{gap:clamp(12px,1.8vh,22px)}
.shotHead{display:flex;flex-direction:column;gap:7px;flex:none}
.shot figure{flex:1;min-height:0;display:flex;flex-direction:column;gap:9px;align-items:center}
.shot img{max-width:100%;max-height:100%;width:auto;object-fit:contain;
  border:1px solid var(--rule);border-radius:4px;
  box-shadow:0 1px 2px rgba(0,0,0,.05),0 18px 44px -22px rgba(0,0,0,.28)}
figcaption{font-size:clamp(12px,1.05vw,15px);color:var(--muted);text-align:center;max-width:46ch}
.duo{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:clamp(16px,2.4vw,38px)}
.duo figure{justify-content:flex-start}

/* ---------- tabla de disimilitudes ---------- */
.tabla{font-family:var(--mono);font-size:clamp(12px,1.15vw,17px);
  border:1px solid var(--rule);border-radius:4px;background:var(--surface);
  max-width:660px;overflow:hidden}
.tr{display:grid;grid-template-columns:1fr 84px 104px;gap:12px;
  padding:9px clamp(14px,1.6vw,20px);border-top:1px solid var(--rule-soft)}
.tr:first-child{border-top:none}
.tr span:not(:first-child){text-align:right;font-variant-numeric:tabular-nums}
.th{background:var(--paper);color:var(--muted);font-size:clamp(9.5px,.85vw,11.5px);
  letter-spacing:.13em;text-transform:uppercase}
.mal{color:var(--alert);font-weight:600}

/* ---------- rejillas ---------- */
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:clamp(20px,3vw,54px);max-width:1000px;margin-top:8px}
.cols2 p{max-width:44ch}
.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,3vw,46px);margin-top:clamp(10px,2vh,22px)}
.cols3 p{font-size:clamp(13px,1.15vw,16.5px)}
.cols3 .n{font-family:var(--mono);font-size:12px;color:var(--alert);letter-spacing:.1em;
  display:block;margin-bottom:10px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(16px,2.4vw,34px) clamp(20px,3vw,48px);
  margin-top:clamp(10px,2vh,20px)}
.grid3 p{font-size:clamp(13px,1.1vw,16px);color:var(--muted)}

/* ---------- meses ---------- */
.meses{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:4px;margin-top:clamp(10px,2vh,22px);overflow:hidden}
.mes{background:var(--surface);padding:clamp(18px,2.4vw,30px);display:flex;flex-direction:column;gap:9px;
  border-top:3px solid var(--tint)}
.m1{--tint:var(--papi)} .m2{--tint:var(--hartman)} .m3{--tint:var(--mabe)}
.mNum{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tint)}
.mes p{font-size:clamp(13px,1.1vw,16px);color:var(--muted)}

/* ---------- inversión ---------- */
.inv{align-items:flex-start}
.precio{display:flex;align-items:baseline;gap:clamp(10px,1.6vw,22px);flex-wrap:wrap;margin:6px 0}
.big{font-family:var(--mono);font-variant-numeric:tabular-nums;
  font-size:clamp(54px,11vw,150px);line-height:.95;letter-spacing:-.045em}
.cur{font-family:var(--mono);font-size:clamp(12px,1.1vw,16px);color:var(--muted);letter-spacing:.05em}
.pagos{display:grid;grid-template-columns:repeat(3,minmax(0,220px));gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:4px;margin-top:clamp(12px,2.4vh,26px);overflow:hidden}
.pagos div{background:var(--surface);padding:clamp(14px,1.8vw,22px);display:flex;flex-direction:column;gap:5px}
.pWhen{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
.pAmt{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:clamp(20px,2.2vw,30px)}

/* ---------- pasos ---------- */
.pasos{display:flex;flex-direction:column;gap:clamp(16px,2.6vh,30px);margin-top:clamp(8px,1.6vh,18px);max-width:920px}
.pasos li{display:grid;grid-template-columns:auto 1fr;gap:clamp(14px,1.8vw,24px);align-items:start}
.pasos .i{font-family:var(--mono);font-size:13px;width:34px;height:34px;border-radius:50%;
  border:1px solid var(--papi);color:var(--papi);display:inline-flex;align-items:center;justify-content:center}
.pasos p{font-size:clamp(13.5px,1.15vw,17px);color:var(--muted);max-width:64ch}

/* ---------- cierre ---------- */
.cierre{gap:clamp(16px,2.6vh,30px)}
.cierre .acc{color:var(--ink)}
.cierreTres{margin-top:clamp(14px,2.4vh,28px);padding-top:clamp(16px,2.4vh,26px);
  border-top:1px solid var(--rule)}

/* ---------- cromo ---------- */
.barra{position:fixed;top:0;left:0;right:0;height:2px;background:transparent;z-index:9}
.barraIn{height:100%;background:var(--ink);width:0;transition:width .4s cubic-bezier(.22,1,.36,1)}
.hud{position:fixed;bottom:clamp(14px,2.4vh,26px);left:clamp(28px,6vw,110px);
  right:clamp(28px,6vw,110px);display:flex;justify-content:space-between;align-items:center;
  gap:16px;z-index:9;pointer-events:none}
.hud .marca{font-family:var(--serif);font-size:13px;color:var(--faint)}
.hud .cuenta{font-family:var(--mono);font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums}
.nav{position:fixed;top:0;bottom:0;width:22%;z-index:8;cursor:pointer;border:none;background:none}
.nav.prev{left:0} .nav.next{right:0}
.pista{position:fixed;bottom:clamp(14px,2.4vh,26px);left:50%;transform:translateX(-50%);
  font-family:var(--mono);font-size:11.5px;color:var(--faint);letter-spacing:.06em;z-index:9;
  transition:opacity .6s;pointer-events:none}
.pista kbd{border:1px solid var(--rule);border-bottom-width:2px;border-radius:3px;
  padding:1px 6px;font-family:var(--mono);font-size:10.5px}
.pista.off{opacity:0}
:focus-visible{outline:2px solid var(--papi);outline-offset:3px}

@media (max-width:760px){
  .cols2,.cols3,.grid3,.meses,.duo{grid-template-columns:1fr}
  .pagos{grid-template-columns:1fr}
  .nav{width:30%}
  .s{padding-left:24px;padding-right:24px}
  .hud{left:24px;right:24px}
}
"""

JS = """
const slides = [...document.querySelectorAll('.s')];
const barra = document.querySelector('.barraIn');
const cuenta = document.querySelector('.cuenta');
const pista = document.querySelector('.pista');
let i = 0;

function ir(n, empujarHash = true) {
  i = Math.max(0, Math.min(slides.length - 1, n));
  slides.forEach((s, k) => s.classList.toggle('on', k === i));
  barra.style.width = ((i + 1) / slides.length * 100) + '%';
  cuenta.textContent = (i + 1) + ' / ' + slides.length;
  if (empujarHash) history.replaceState(null, '', '#' + (i + 1));
  if (i > 0) pista.classList.add('off');
}

addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'PageDown') {
    e.preventDefault(); ir(i + 1);
  } else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') {
    e.preventDefault(); ir(i - 1);
  } else if (k === 'Home') { e.preventDefault(); ir(0); }
  else if (k === 'End') { e.preventDefault(); ir(slides.length - 1); }
  else if (k === 'f' || k === 'F') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  }
});

document.querySelector('.prev').onclick = () => ir(i - 1);
document.querySelector('.next').onclick = () => ir(i + 1);

// deslizar en táctil
let x0 = null;
addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 48) ir(i + (dx < 0 ? 1 : -1));
  x0 = null;
}, { passive: true });

const inicial = parseInt(location.hash.slice(1), 10);
ir(Number.isFinite(inicial) && inicial > 0 ? inicial - 1 : 0, false);
setTimeout(() => pista.classList.add('off'), 6000);
"""

html = f"""<title>Plataforma de evaluación psicológica — Presentación</title>

<style>{CSS}</style>

<div class="barra"><div class="barraIn"></div></div>

<div class="deck">
{chr(10).join(SLIDES)}
</div>

<button class="nav prev" aria-label="Diapositiva anterior"></button>
<button class="nav next" aria-label="Diapositiva siguiente"></button>

<div class="hud">
  <span class="marca">Evaluación psicológica</span>
  <span class="cuenta"></span>
</div>

<div class="pista"><kbd>←</kbd> <kbd>→</kbd> para navegar · <kbd>F</kbd> pantalla completa</div>

<script>{JS}</script>
"""

DEST.write_text(html)
print(f"slides: {len(SLIDES)}")
print(f"html:   {len(html)//1024} KB -> {DEST}")
