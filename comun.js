/* Utilidades compartidas: creación de elementos, controles, lienzos y bucles de animación. */
(function () {
  const CM = (window.CM = window.CM || {});
  CM.modulos = CM.modulos || {};
  CM.L = window.CMLogica;

  let n = 0;
  CM.uid = (p) => (p || 'c') + '-' + ++n;

  CM.h = function (tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const k of Array.prototype.slice.call(arguments, 2).flat()) {
      if (k == null || k === false) continue;
      e.append(k.nodeType ? k : document.createTextNode(String(k)));
    }
    return e;
  };
  const h = CM.h;

  CM.token = (nombre) => getComputedStyle(document.documentElement).getPropertyValue('--' + nombre).trim();
  CM.reducirMovimiento = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  CM.lienzo = function (padre, clase) {
    const cv = h('canvas', { class: clase || 'lienzo' });
    padre.append(cv);
    const ctx = cv.getContext('2d');
    return {
      cv,
      ctx,
      ajustar(w, hh) {
        const d = window.devicePixelRatio || 1;
        w = Math.max(1, Math.floor(w));
        hh = Math.max(1, Math.floor(hh));
        cv.width = Math.round(w * d);
        cv.height = Math.round(hh * d);
        cv.style.width = w + 'px';
        cv.style.height = hh + 'px';
        ctx.setTransform(d, 0, 0, d, 0, 0);
      },
    };
  };

  CM.observar = function (el, fn) {
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fn);
    });
    ro.observe(el);
    return ro;
  };

  /* ---------- Controles ---------- */
  CM.deslizador = function ({ etiqueta, min, max, paso = 1, valor, alCambiar, formato }) {
    const id = CM.uid('rango');
    const f = formato || ((v) => v);
    const out = h('output', { for: id, class: 'valor' }, f(valor));
    const inp = h('input', { type: 'range', id, min, max, step: paso, value: valor });
    inp.addEventListener('input', () => {
      out.textContent = f(+inp.value);
      alCambiar(+inp.value);
    });
    const w = h('label', { class: 'ctrl ctrl-rango', for: id }, h('span', { class: 'ctrl-et' }, etiqueta), inp, out);
    w.fijar = (v) => {
      inp.value = v;
      out.textContent = f(+inp.value);
    };
    return w;
  };

  CM.boton = function (texto, alClic, clase) {
    return h('button', { type: 'button', class: 'btn ' + (clase || ''), onclick: alClic }, texto);
  };

  CM.casilla = function ({ etiqueta, valor, alCambiar }) {
    const id = CM.uid('casilla');
    const inp = h('input', { type: 'checkbox', id });
    inp.checked = !!valor;
    inp.addEventListener('change', () => alCambiar(inp.checked));
    const w = h('label', { class: 'ctrl ctrl-casilla', for: id }, inp, h('span', null, etiqueta));
    w.input = inp;
    w.fijar = (v) => (inp.checked = !!v);
    return w;
  };

  CM.numero = function ({ etiqueta, valor, paso = 1, min, max, alCambiar }) {
    const id = CM.uid('num');
    const inp = h('input', { type: 'number', id, value: valor, step: paso, min, max, inputmode: 'decimal' });
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);
      if (!isNaN(v)) alCambiar(v);
    });
    const w = h('label', { class: 'ctrl ctrl-numero', for: id }, h('span', { class: 'ctrl-et' }, etiqueta), inp);
    w.fijar = (v) => (inp.value = v);
    return w;
  };

  // Botones de opción excluyentes
  CM.segmentado = function ({ opciones, valor, alCambiar }) {
    const fila = h('div', { class: 'fila-botones', role: 'group' });
    const botones = opciones.map((o) => {
      const b = CM.boton(o.t, () => {
        fijar(o.v);
        alCambiar(o.v);
      });
      b.dataset.v = o.v;
      fila.append(b);
      return b;
    });
    function fijar(v) {
      botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    }
    fijar(valor);
    fila.fijar = fijar;
    return fila;
  };

  CM.grupo = function (titulo) {
    const g = h('div', { class: 'grupo' });
    if (titulo) g.append(h('span', { class: 'etiqueta' }, titulo));
    for (const k of Array.prototype.slice.call(arguments, 1)) if (k) g.append(k);
    return g;
  };

  // Estructura común de un módulo: panel de controles + vista con lienzo y pie.
  CM.esqueleto = function (el, opciones) {
    const compacto = !!(opciones && opciones.compacto);
    const controles = h('div', { class: 'modulo-controles' });
    const area = h('div', { class: 'modulo-area' });
    const pie = h('div', { class: 'modulo-pie', 'aria-live': 'polite' });
    const vista = h('div', { class: 'modulo-vista' }, area, pie);
    const raiz = h('div', { class: 'modulo' + (compacto ? ' compacto' : '') }, controles, vista);
    el.append(raiz);
    return { raiz, controles, area, pie, vista, compacto };
  };

  // Bucle de animación con velocidad ajustable (pasos por segundo).
  CM.bucle = function (paso) {
    let activo = false, ultimo = 0, raf = 0, pps = 8;
    const r = {
      alCambiar: null,
      get activo() { return activo; },
      get pps() { return pps; },
      set pps(v) { pps = v; },
      iniciar() {
        if (activo) return;
        activo = true;
        ultimo = 0;
        raf = requestAnimationFrame(tick);
        r.alCambiar && r.alCambiar(true);
      },
      detener() {
        if (!activo) return;
        activo = false;
        cancelAnimationFrame(raf);
        r.alCambiar && r.alCambiar(false);
      },
      alternar() { activo ? r.detener() : r.iniciar(); },
    };
    function tick(t) {
      if (!activo) return;
      if (!ultimo || t - ultimo >= 1000 / pps) {
        ultimo = t;
        if (paso() === false) { r.detener(); return; }
      }
      raf = requestAnimationFrame(tick);
    }
    return r;
  };

  // Botón de reproducir / pausar ligado a un bucle
  CM.botonPlay = function (bucle, textos) {
    const t = textos || ['Animar', 'Pausar'];
    const b = CM.boton(t[0], () => bucle.alternar(), 'principal');
    const previo = bucle.alCambiar;
    bucle.alCambiar = (a) => {
      b.textContent = a ? t[1] : t[0];
      previo && previo(a);
    };
    return b;
  };

  CM.letraFila = (i) => String.fromCharCode(65 + i);

  // Selector de la regla de cambio entre rondas (juegos en red)
  CM.TEXTO_DINAMICA = {
    nowak: 'Imitar al mejor (Nowak): copias la estrategia del vecino que más puntos hizo, si hizo más que tú.',
    nash: 'Mejor respuesta (Nash): eliges la estrategia que te daría más puntos si tus vecinos no cambiaran.',
  };
  CM.selectorDinamica = function ({ valor, alCambiar }) {
    const texto = h('p', null, CM.TEXTO_DINAMICA[valor]);
    const seg = CM.segmentado({
      opciones: [{ v: 'nowak', t: 'Imitar al mejor' }, { v: 'nash', t: 'Mejor respuesta' }],
      valor,
      alCambiar: (v) => { texto.textContent = CM.TEXTO_DINAMICA[v]; alCambiar(v); },
    });
    const g = CM.grupo('Cómo cambia cada uno', seg, texto);
    g.fijar = (v) => { seg.fijar(v); texto.textContent = CM.TEXTO_DINAMICA[v]; };
    return g;
  };

  /* ---------- Dibujo de los 8 casos de una regla ---------- */
  // Devuelve un elemento con los 8 vecindarios (111 … 000) y su resultado.
  CM.casos = function ({ regla, editable, bits, tam, alCambiar }) {
    const cont = h('div', { class: 'casos' });
    if (tam) cont.style.setProperty('--t', tam);
    let actual = regla;
    function pintar() {
      cont.replaceChildren();
      for (let k = 7; k >= 0; k--) {
        const l = (k >> 2) & 1, c = (k >> 1) & 1, r = k & 1;
        const res = (actual >> k) & 1;
        const trio = h('span', { class: 'trio' }, h('i', { class: l ? 'v' : '' }), h('i', { class: c ? 'v' : '' }), h('i', { class: r ? 'v' : '' }));
        const abajo = h('span', { class: 'trio' }, h('i', { class: res ? 'v' : '' }));
        const kids = [trio, abajo];
        if (bits) kids.push(h('span', { class: 'bit' }, res));
        const caso = editable
          ? h('button', { type: 'button', class: 'caso', 'aria-label': `Caso ${l}${c}${r}: resultado ${res}. Clic para cambiar.`, onclick: () => { actual ^= 1 << k; pintar(); alCambiar && alCambiar(actual); } }, kids)
          : h('div', { class: 'caso' }, kids);
        cont.append(caso);
      }
    }
    pintar();
    cont.fijar = (v) => { actual = v; pintar(); };
    return cont;
  };

  // Dibuja un autómata 1D en un lienzo (para miniaturas y diapositivas)
  CM.dibujarRegla = function (ctx, w, hh, regla, filasVisibles, opciones) {
    const op = opciones || {};
    const tam = op.tam || Math.max(2, Math.floor(w / (op.ancho || 101)));
    const ancho = op.ancho || Math.floor(w / tam);
    const gens = Math.floor(hh / tam);
    let inicio = op.inicio;
    if (!inicio && op.azar) {
      let x = op.semilla || 7;
      const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
      inicio = CM.L.ca1dFilaInicial(ancho, 'azar', r);
      for (let t = 0; t < (op.descartar || 0); t++) inicio = CM.L.ca1dPaso(regla, inicio, op.periodico);
    }
    const filas = CM.L.ca1d(regla, ancho, gens, inicio, op.periodico);
    const ox = Math.floor((w - ancho * tam) / 2);
    ctx.fillStyle = op.muerta || CM.token('cel-muerta');
    ctx.fillRect(0, 0, w, hh);
    ctx.fillStyle = op.viva || CM.token('cel-viva');
    const hasta = Math.min(filas.length, filasVisibles == null ? filas.length : filasVisibles);
    for (let t = 0; t < hasta; t++) {
      const f = filas[t];
      for (let i = 0; i < ancho; i++) if (f[i]) ctx.fillRect(ox + i * tam, t * tam, tam, tam);
    }
    return { gens: filas.length };
  };

  /* ---------- Cuadrícula de casillas (Coordinación y Dilema) ---------- */
  // Calcula la geometría de una cuadrícula n×n con márgenes para rótulos A–E / 1–5.
  CM.geometria = function (w, hh, n, rotulos) {
    const margen = rotulos ? Math.max(18, Math.min(w, hh) * 0.06) : 0;
    const lado = Math.floor(Math.min(w - margen, hh - margen) / n);
    const ox = Math.floor((w - margen - lado * n) / 2 + margen);
    const oy = Math.floor((hh - margen - lado * n) / 2 + margen);
    return { lado, ox, oy, margen };
  };

  CM.dibujarRotulos = function (ctx, g, n) {
    ctx.fillStyle = CM.token('tinta-2');
    ctx.font = `700 ${Math.max(11, Math.min(18, g.lado * 0.3))}px ${CM.token('f-mono')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      ctx.fillText(CM.letraFila(i), g.ox - g.margen / 2 - 2, g.oy + i * g.lado + g.lado / 2);
      ctx.fillText(String(i + 1), g.ox + i * g.lado + g.lado / 2, g.oy - g.margen / 2 - 2);
    }
  };

  CM.celdaEn = function (cv, g, n, ev) {
    const r = cv.getBoundingClientRect();
    const x = ev.clientX - r.left - g.ox, y = ev.clientY - r.top - g.oy;
    const j = Math.floor(x / g.lado), i = Math.floor(y / g.lado);
    if (i < 0 || j < 0 || i >= n || j >= n) return -1;
    return i * n + j;
  };

  // Gráfica pequeña de una serie en porcentaje (0–100)
  CM.grafica = function (padre, etiquetaSerie, colorToken) {
    const caja = h('div', { class: 'grafica-caja' });
    padre.append(caja);
    const lz = CM.lienzo(caja, 'grafica');
    let serie = [];
    function dibujar() {
      const w = caja.clientWidth || 300, hh = 90;
      lz.ajustar(w, hh);
      const c = lz.ctx;
      const izq = 34, der = 8, arr = 8, abj = 18;
      c.clearRect(0, 0, w, hh);
      c.font = `11px ${CM.token('f-mono')}`;
      c.fillStyle = CM.token('tinta-2');
      c.strokeStyle = CM.token('linea');
      c.lineWidth = 1;
      c.textAlign = 'right';
      c.textBaseline = 'middle';
      for (const v of [0, 50, 100]) {
        const y = arr + (1 - v / 100) * (hh - arr - abj);
        c.beginPath(); c.moveTo(izq, y + 0.5); c.lineTo(w - der, y + 0.5); c.stroke();
        c.fillText(v + '%', izq - 5, y);
      }
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText(etiquetaSerie + ' por ronda', izq, hh - 4);
      if (serie.length < 1) return;
      const nx = Math.max(serie.length - 1, 1);
      const X = (i) => izq + (i / nx) * (w - izq - der);
      const Y = (v) => arr + (1 - v / 100) * (hh - arr - abj);
      c.strokeStyle = CM.token(colorToken);
      c.lineWidth = 2;
      c.beginPath();
      serie.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))));
      c.stroke();
      const ult = serie.length - 1;
      c.fillStyle = CM.token(colorToken);
      c.beginPath(); c.arc(X(ult), Y(serie[ult]), 3.5, 0, Math.PI * 2); c.fill();
    }
    CM.observar(caja, dibujar);
    return {
      fijar(s) { serie = s.slice(); dibujar(); },
    };
  };

  /* ---------- Montaje ---------- */
  CM.montar = function (el, nombre, opciones) {
    const m = CM.modulos[nombre];
    if (!m) { el.textContent = 'Módulo no encontrado: ' + nombre; return null; }
    return m(el, opciones || {});
  };

  // Redibuja los lienzos si cambia el tema del sistema
  if (window.matchMedia) {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => window.dispatchEvent(new Event('cm-tema')));
  }
  new MutationObserver(() => window.dispatchEvent(new Event('cm-tema'))).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
