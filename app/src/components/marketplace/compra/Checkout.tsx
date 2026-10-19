"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, CreditCard, Landmark, Lock, Store } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { RUTAS } from "@/lib/ceduct/rutas";
import { calcularTotales } from "@/lib/ceduct/totales";
import { precio } from "@/lib/ceduct/tipos";
import { CONTACTO, whatsapp } from "@/lib/contacto";
import { Totales } from "./Resumen";
import s from "../mk.module.css";
import k from "./compra.module.css";

type Metodo = "tarjeta" | "transferencia" | "oxxo";

const METODOS: { id: Metodo; titulo: string; texto: string; Icono: typeof CreditCard }[] = [
  { id: "tarjeta", titulo: "Tarjeta", texto: "Crédito o débito. Acceso inmediato.", Icono: CreditCard },
  { id: "transferencia", titulo: "Transferencia SPEI", texto: "Te damos la CLABE y tu folio.", Icono: Landmark },
  { id: "oxxo", titulo: "OXXO Pay", texto: "Paga en efectivo en cualquier OXXO.", Icono: Store },
];

/** RFC de persona física (13) o moral (12). Validación de forma, no del SAT. */
const RFC = /^([A-ZÑ&]{3,4})(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([A-Z\d]{2})([A\d])$/;

type Confirmacion = {
  pedidoId: string;
  total: number;
  metodo: Metodo;
  email: string;
  demo: boolean;
};

export function Checkout() {
  const { items, listo, vaciar, cupon } = useCarrito();
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rfc: "",
    razonSocial: "",
    cp: "",
  });
  const [factura, setFactura] = useState(false);
  const [metodo, setMetodo] = useState<Metodo>("tarjeta");
  const [acepto, setAcepto] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<keyof typeof datos | "acepto", string>>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [hecho, setHecho] = useState<Confirmacion | null>(null);

  const campo = (k: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = k === "rfc" ? e.target.value.toUpperCase() : e.target.value;
    setDatos((d) => ({ ...d, [k]: v }));
    if (errores[k]) setErrores((x) => ({ ...x, [k]: undefined }));
  };

  function validar() {
    const e: typeof errores = {};
    if (datos.nombre.trim().length < 3) e.nombre = "Escribe tu nombre completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) e.email = "Revisa tu correo: no parece válido.";
    if (factura) {
      if (!RFC.test(datos.rfc.trim())) e.rfc = "El RFC debe tener 12 o 13 caracteres (ej. ABCD800101XX1).";
      if (datos.razonSocial.trim().length < 3) e.razonSocial = "Escribe la razón social tal como aparece en tu constancia fiscal.";
      if (datos.cp && !/^\d{5}$/.test(datos.cp)) e.cp = "El código postal tiene 5 dígitos.";
    }
    if (!acepto) e.acepto = "Necesitamos tu aceptación para continuar.";
    setErrores(e);
    const primero = Object.keys(e)[0];
    if (primero) document.getElementById(`co-${primero}`)?.focus();
    return !primero;
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validar()) return;
    setEnviando(true);
    setErrorGeneral(null);
    const t = calcularTotales(items, cupon);

    // Catálogo de ejemplo: no hay nada que cobrar, se simula la orden.
    if (items.every((i) => i.demo)) {
      await new Promise((r) => setTimeout(r, 700));
      setHecho({
        pedidoId: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        total: t.total,
        metodo,
        email: datos.email.trim(),
        demo: true,
      });
      vaciar();
      setEnviando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          email: datos.email.trim(),
          telefono: datos.telefono.trim(),
          slugs: items.filter((i) => !i.demo).map((i) => i.slug),
          cupon: cupon?.code ?? null,
          metodoPago: metodo,
          factura: factura
            ? { rfc: datos.rfc.trim(), razonSocial: datos.razonSocial.trim(), cp: datos.cp.trim() || null }
            : null,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo registrar tu pedido. Intenta de nuevo.");
      vaciar();
      if (d.pagoUrl) {
        window.location.href = d.pagoUrl;
        return;
      }
      setHecho({ pedidoId: d.pedidoId, total: d.total, metodo, email: datos.email.trim(), demo: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorGeneral((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) return <PantallaConfirmacion c={hecho} />;

  if (listo && items.length === 0) {
    return (
      <div className={`${s.contenedor} ${k.pagina}`}>
        <div className={k.vacio}>
          <h1 className={k.titulo}>No hay nada que pagar.</h1>
          <p className={s.lead}>Agrega un programa al carrito para continuar.</p>
          <Link href={RUTAS.catalogo()} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
            Ir al catálogo <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const err = (k: keyof typeof errores) =>
    errores[k] ? (
      <p id={`co-${k}-err`} className={s.error}>
        {errores[k]}
      </p>
    ) : null;
  const props = (k: keyof typeof datos) => ({
    id: `co-${k}`,
    className: s.entrada,
    value: datos[k],
    onChange: campo(k),
    "aria-invalid": Boolean(errores[k]),
    "aria-describedby": errores[k] ? `co-${k}-err` : undefined,
  });

  return (
    <div className={`${s.contenedor} ${k.pagina}`}>
      <ol className={k.pasos} aria-label="Progreso de compra">
        <li data-hecho="true"><Link href={RUTAS.carrito}>Carrito</Link></li>
        <li aria-current="step">Datos y pago</li>
        <li>Confirmación</li>
      </ol>
      <h1 className={k.titulo}>Finaliza tu compra</h1>

      <form className={k.rejilla} onSubmit={enviar} noValidate>
        <div className={k.formulario}>
          {/* ---------------------------------------------- Datos */}
          <fieldset className={`${s.tarjeta} ${k.bloque}`}>
            <legend className={k.bloqueTitulo}><span>1</span> Tus datos</legend>
            <div className={k.campos}>
              <label className={`${s.campo} ${k.ancho}`} htmlFor="co-nombre">
                <span>Nombre completo *</span>
                <input {...props("nombre")} autoComplete="name" required />
                {err("nombre")}
              </label>
              <label className={s.campo} htmlFor="co-email">
                <span>Correo electrónico *</span>
                <input {...props("email")} type="email" autoComplete="email" inputMode="email" required />
                {err("email")}
              </label>
              <label className={s.campo} htmlFor="co-telefono">
                <span>Teléfono (opcional)</span>
                <input {...props("telefono")} type="tel" autoComplete="tel" inputMode="tel" />
              </label>
            </div>
            <p className={s.ayuda}>Enviaremos tu acceso y comprobante a este correo.</p>
          </fieldset>

          {/* -------------------------------------------- Factura */}
          <fieldset className={`${s.tarjeta} ${k.bloque}`}>
            <legend className={k.bloqueTitulo}><span>2</span> Facturación</legend>
            <label className={k.interruptor}>
              <input type="checkbox" checked={factura} onChange={(e) => setFactura(e.target.checked)} />
              <span aria-hidden />
              Necesito factura (CFDI)
            </label>
            {factura && (
              <div className={k.campos}>
                <label className={s.campo} htmlFor="co-rfc">
                  <span>RFC *</span>
                  <input {...props("rfc")} maxLength={13} autoComplete="off" spellCheck={false} />
                  {err("rfc")}
                </label>
                <label className={s.campo} htmlFor="co-cp">
                  <span>Código postal fiscal</span>
                  <input {...props("cp")} inputMode="numeric" maxLength={5} autoComplete="postal-code" />
                  {err("cp")}
                </label>
                <label className={`${s.campo} ${k.ancho}`} htmlFor="co-razonSocial">
                  <span>Razón social *</span>
                  <input {...props("razonSocial")} autoComplete="organization" />
                  {err("razonSocial")}
                </label>
              </div>
            )}
          </fieldset>

          {/* ---------------------------------------------- Pago */}
          <fieldset className={`${s.tarjeta} ${k.bloque}`}>
            <legend className={k.bloqueTitulo}><span>3</span> Método de pago</legend>
            <div className={k.metodos}>
              {METODOS.map(({ id, titulo, texto, Icono }) => (
                <label key={id} className={k.metodo} data-activo={metodo === id}>
                  <input
                    type="radio"
                    name="metodo"
                    value={id}
                    checked={metodo === id}
                    onChange={() => setMetodo(id)}
                  />
                  <Icono size={26} aria-hidden />
                  <strong>{titulo}</strong>
                  <span>{texto}</span>
                </label>
              ))}
            </div>
            {metodo === "tarjeta" && (
              <p className={k.notaMetodo}>
                <Lock size={14} aria-hidden /> Al continuar te llevamos a la página de pago seguro (Stripe). CEDUCT no guarda los datos de tu tarjeta.
              </p>
            )}
            {metodo === "transferencia" && (
              <p className={k.notaMetodo}>Al confirmar recibirás la CLABE y tu número de orden como referencia. Tu acceso se activa al conciliar el pago.</p>
            )}
            {metodo === "oxxo" && (
              <p className={k.notaMetodo}>Recibirás una ficha con referencia para pagar en efectivo en OXXO. Tu acceso se activa cuando se acredita el pago (hasta 24 h).</p>
            )}
          </fieldset>

          <label className={k.acepto}>
            <input
              id="co-acepto"
              type="checkbox"
              checked={acepto}
              onChange={(e) => {
                setAcepto(e.target.checked);
                setErrores((x) => ({ ...x, acepto: undefined }));
              }}
              aria-invalid={Boolean(errores.acepto)}
              aria-describedby={errores.acepto ? "co-acepto-err" : undefined}
            />
            <span>
              Acepto los <Link href={RUTAS.legal}>términos y condiciones</Link> y el{" "}
              <Link href={RUTAS.legal}>aviso de privacidad</Link>.
            </span>
          </label>
          {err("acepto")}
        </div>

        <aside className={k.lateral} aria-label="Resumen del pedido">
          <Totales titulo="Tu pedido">
            <ul className={k.miniLista}>
              {items.map((i) => (
                <li key={i.slug}>
                  <span>{i.titulo}</span>
                  <strong>{precio(i.precioMxn)}</strong>
                </li>
              ))}
            </ul>
            {errorGeneral && <p className={s.error} role="alert">{errorGeneral}</p>}
            <button
              type="submit"
              className={`${s.btn} ${s.btnPrimario} ${s.btnGrande} ${s.btnBloque}`}
              disabled={enviando || !listo}
            >
              {enviando
                ? "Procesando…"
                : metodo === "tarjeta"
                  ? "Pagar con tarjeta"
                  : "Confirmar pedido"}
              {!enviando && <ArrowRight size={18} aria-hidden />}
            </button>
            <p className={k.seguro}><Lock size={14} aria-hidden /> Conexión cifrada · Datos protegidos</p>
          </Totales>
        </aside>
      </form>
    </div>
  );
}

function PantallaConfirmacion({ c }: { c: Confirmacion }) {
  const [copiado, setCopiado] = useState(false);
  const instrucciones: Record<Metodo, string> = {
    tarjeta: "Tu pago está en proceso. En cuanto se confirme recibirás tu acceso por correo.",
    transferencia:
      "Transfiere el total a la CLABE [CLABE INTERBANCARIA] (beneficiario: CEDUCT A.C.) usando tu número de orden como referencia.",
    oxxo: "Te enviamos la ficha de pago OXXO por correo. Preséntala en caja; tu acceso se activa al acreditarse.",
  };

  return (
    <div className={`${s.contenedor} ${k.pagina}`}>
      <ol className={k.pasos} aria-label="Progreso de compra">
        <li data-hecho="true">Carrito</li>
        <li data-hecho="true">Datos y pago</li>
        <li aria-current="step">Confirmación</li>
      </ol>
      <div className={`${s.tarjeta} ${k.confirmacion}`}>
        <span className={k.confirmacionIcono} aria-hidden><Check size={40} strokeWidth={2.6} /></span>
        <h1 className={k.titulo}>¡Pedido recibido!</h1>
        {c.demo && <p className={s.avisoDemo}>Orden de demostración: no se realizó ningún cargo.</p>}
        <div className={k.orden}>
          <span>Número de orden</span>
          <strong>{c.pedidoId}</strong>
          <button
            type="button"
            className={`${s.btn} ${s.btnFantasma} ${s.btnCompacto}`}
            onClick={() => {
              void navigator.clipboard?.writeText(c.pedidoId);
              setCopiado(true);
            }}
          >
            <Copy size={14} aria-hidden /> {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className={s.lead}>
          Total: <strong>{precio(c.total, true)} MXN</strong>. Enviamos el detalle a <strong>{c.email}</strong>.
        </p>
        <p className={k.instrucciones}>{instrucciones[c.metodo]}</p>
        <div className={k.vacioBotones}>
          <Link href={RUTAS.misCursos} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
            Ir a mis cursos <ArrowRight size={18} aria-hidden />
          </Link>
          <a
            className={`${s.btn} ${s.btnSecundario} ${s.btnGrande}`}
            href={whatsapp(`Hola, acabo de hacer un pedido. Mi número de orden es ${c.pedidoId}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Dudas por WhatsApp
          </a>
        </div>
        <p className={s.meta}>¿No te llegó el correo? Escríbenos a {CONTACTO.email}.</p>
      </div>
    </div>
  );
}
