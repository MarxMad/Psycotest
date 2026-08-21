#!/usr/bin/env python3
"""Genera PDF del acuerdo y la propuesta 2026 desde Markdown + Chrome headless."""

import re
import subprocess
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

FONTS_LINK = (
    '<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700'
    '&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">'
)

PROPUESTA_CSS = """
@page { size: letter; margin: 2cm; }
body { font-family: Calibri, "Segoe UI", sans-serif; font-size: 10.5pt; line-height: 1.35; color: #1a1c20; max-width: 17cm; margin: 0 auto; }
h1 { font-family: Cambria, Georgia, serif; font-size: 20pt; font-weight: normal; margin: 0 0 6px; page-break-after: avoid; }
h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.04em; color: #3e5a6e; border-bottom: 1px solid #c8ccd0; padding-bottom: 4px; margin: 20px 0 8px; page-break-after: avoid; }
h3 { font-size: 10.5pt; margin: 12px 0 6px; page-break-after: avoid; }
p, li { margin: 0 0 6px; }
ul { margin: 4px 0 10px; padding-left: 1.3em; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 10pt; }
th, td { border-bottom: 1px solid #e8eaed; padding: 5px 6px; text-align: left; vertical-align: top; }
th { font-size: 9pt; color: #555a60; font-weight: 600; }
td:last-child, th:last-child { text-align: right; }
hr { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
@media print { body { padding: 0; } }
"""

CONTRACT_CSS = """
@page { size: letter; margin: 2.2cm 2cm 2.4cm; }
:root {
  --ink: #0f1419; --muted: #5a6570; --teal: #1a6b7a; --teal-l: #2a9aad;
  --border: #d8dde3; --surface: #f4f1ec;
}
* { box-sizing: border-box; }
body {
  font-family: 'Source Sans 3', 'Segoe UI', sans-serif;
  font-size: 10.5pt; line-height: 1.45; color: var(--ink);
  max-width: 18cm; margin: 0 auto; padding: 1.5rem 0 3rem;
  background: var(--surface);
}
.doc {
  background: #fff; padding: 2.2rem 2.4rem;
  border: 1px solid var(--border);
  box-shadow: 0 2px 24px rgba(15,20,25,.06);
}
@media print {
  body { background: #fff; padding: 0; }
  .doc { border: none; box-shadow: none; padding: 0; }
}

.doc-header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--teal); }
.doc-header h1 {
  font-family: 'Source Serif 4', Georgia, serif;
  font-size: 1.55rem; font-weight: 700; margin: 0 0 .35rem; letter-spacing: -.01em;
}
.doc-header .subtitle {
  font-size: .82rem; color: var(--muted); font-weight: 500; margin: 0;
}

.parties {
  width: 100%; border-collapse: collapse; margin: 0 0 1.25rem; font-size: .88rem;
  border: 1px solid var(--border);
}
.parties td {
  padding: .55rem .75rem; vertical-align: top; border-bottom: 1px solid var(--border);
}
.parties td:first-child {
  width: 28%; font-weight: 600; background: #f7f9fa; color: var(--teal);
  border-right: 1px solid var(--border);
}
.parties tr:last-child td { border-bottom: none; }

h2 {
  font-family: 'Source Sans 3', sans-serif;
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: var(--teal);
  border-bottom: 1px solid var(--border);
  padding-bottom: .35rem; margin: 1.6rem 0 .75rem;
  page-break-after: avoid;
}
h2:first-of-type { margin-top: 0; }

h1 {
  font-family: 'Source Serif 4', Georgia, serif;
  font-size: 1.15rem; font-weight: 700; color: var(--ink);
  margin: 2rem 0 .75rem; page-break-before: always;
  page-break-after: avoid;
}
h1:first-of-type { page-break-before: avoid; margin-top: 0; }

h3 {
  font-family: 'Source Sans 3', sans-serif;
  font-size: .95rem; font-weight: 600; color: var(--ink);
  margin: 1rem 0 .4rem; page-break-after: avoid;
}

p { margin: 0 0 .55rem; text-align: justify; hyphens: auto; }
p strong { font-weight: 600; }

ul { margin: .25rem 0 .75rem; padding-left: 1.25rem; }
li { margin-bottom: .3rem; }

table:not(.parties) {
  width: 100%; border-collapse: collapse; margin: .5rem 0 1rem; font-size: .88rem;
  border: 1px solid var(--border);
}
table:not(.parties) th {
  background: var(--teal); color: #fff; font-weight: 600;
  font-size: .72rem; text-transform: uppercase; letter-spacing: .04em;
  padding: .45rem .6rem; text-align: left;
}
table:not(.parties) td {
  padding: .45rem .6rem; border-bottom: 1px solid var(--border); vertical-align: top;
}
table:not(.parties) tr:last-child td { border-bottom: none; }
table:not(.parties) td:last-child,
table:not(.parties) th:last-child { text-align: right; }

hr { border: none; border-top: 1px solid var(--border); margin: 1.25rem 0; }

em { font-style: italic; color: var(--muted); }

.signatures {
  margin-top: 2.5rem; page-break-inside: avoid;
}
.signatures table { border: none; margin-top: 1rem; }
.signatures td {
  width: 50%; text-align: center; vertical-align: bottom;
  padding: 2rem 1rem 0; border: none !important;
}
.sign-line {
  border-bottom: 1px solid var(--ink); height: 2.5rem; margin-bottom: .5rem;
}
.sign-name { font-family: 'Source Serif 4', Georgia, serif; font-weight: 600; font-size: .95rem; }
.sign-role { font-size: .78rem; color: var(--muted); margin-top: .15rem; }

.footnote {
  font-size: .78rem; color: var(--muted); margin-top: 1.5rem;
  padding-top: .75rem; border-top: 1px solid var(--border);
  font-style: italic;
}
"""


def md_to_html(md_text: str, title: str, css: str, *, contract: bool = False) -> str:
    try:
        import markdown
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown", "-q"])
        import markdown

    md_text = re.sub(
        r"```mermaid\n.*?```",
        "_Diagrama omitido en impresión._",
        md_text,
        flags=re.DOTALL,
    )

    body = markdown.markdown(md_text, extensions=["tables", "nl2br", "sane_lists"])

    if contract:
        # Encabezado formal: primer h1 + h2 como cabecera del contrato
        body = re.sub(
            r"<h1>Acuerdo de colaboración</h1>\s*<h2>Plataforma integral[^<]*</h2>",
            r'<div class="doc-header"><h1>Acuerdo de colaboración</h1>'
            r'<p class="subtitle">Plataforma integral de evaluación psicológica y formación profesional</p></div>',
            body,
            count=1,
        )
        # Tabla de partes con clase
        body = body.replace("<table>", '<table class="parties">', 1)
        # Anexos en página nueva
        body = re.sub(r"<h1>Anexo", r'<h1 class="annex">Anexo', body)
        # Bloque de firmas
        body = re.sub(
            r"<h2>FIRMAS</h2>\s*<table>.*?</table>\s*<p><em>Los datos de facturación[^<]*</em></p>",
            _signatures_block,
            body,
            flags=re.DOTALL,
            count=1,
        )
        # Nota final
        body = re.sub(
            r"<p><em>Documento listo para exportar[^<]*</em></p>",
            r'<p class="footnote">Documento listo para exportar a PDF. Sustituye el acuerdo de julio 2026 '
            r"en lo relativo a precio, alcance ampliado y calendario de pagos; lo no modificado "
            r"expresamente sigue en espíritu de colaboración entre las partes.</p>",
            body,
            count=1,
        )
        wrapper = f'<div class="doc">{body}</div>'
    else:
        wrapper = body

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  {FONTS_LINK if contract else ""}
  <style>{css}</style>
</head>
<body>
{wrapper}
</body>
</html>"""


def _signatures_block(_match: re.Match) -> str:
    return """<h2>FIRMAS</h2>
<div class="signatures">
  <table><tr>
    <td><div class="sign-line"></div><div class="sign-name">Gerardo Pedrizco Vela</div><div class="sign-role">El desarrollador</div></td>
    <td><div class="sign-line"></div><div class="sign-name">Martín Hernández González</div><div class="sign-role">El cliente</div></td>
  </tr></table>
  <p class="footnote" style="margin-top:1rem;border:none;padding:0;font-style:italic;">Los datos de facturación se intercambian por separado.</p>
</div>"""


def html_to_pdf(html_path: Path, pdf_path: Path) -> None:
    if not Path(CHROME).exists():
        raise SystemExit(f"No se encontró Chrome en {CHROME}")

    url = html_path.resolve().as_uri()
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path.resolve()}",
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 or not pdf_path.exists():
        raise SystemExit(f"Error al generar PDF:\n{result.stderr}\n{result.stdout}")


def convert(
    md_name: str,
    pdf_name: str,
    title: str,
    *,
    css: str = PROPUESTA_CSS,
    contract: bool = False,
    html_main: str | None = None,
) -> Path:
    md_path = DOCS / md_name
    html_path = DOCS / pdf_name.replace(".pdf", "-print.html")
    pdf_path = DOCS / pdf_name

    html = md_to_html(md_path.read_text(encoding="utf-8"), title, css, contract=contract)
    html_path.write_text(html, encoding="utf-8")
    if html_main:
        (DOCS / html_main).write_text(html, encoding="utf-8")
    html_to_pdf(html_path, pdf_path)
    return pdf_path


def main():
    convert(
        "ACUERDO-COLABORACION-2026.md",
        "Acuerdo de colaboración 2026.pdf",
        "Acuerdo de colaboración 2026",
        css=CONTRACT_CSS,
        contract=True,
        html_main="Acuerdo de colaboración 2026.html",
    )
    print("Generado: Acuerdo de colaboración 2026.pdf")
    print("Generado: Acuerdo de colaboración 2026.html")

    out = convert(
        "PROPUESTA-PLATAFORMA-INTEGRAL-2026.md",
        "Propuesta plataforma integral 2026.pdf",
        "Propuesta plataforma integral 2026",
        css=PROPUESTA_CSS,
        contract=False,
    )
    print(f"Generado: {out}")


if __name__ == "__main__":
    main()
