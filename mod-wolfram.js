/* Módulo 2: explorador de las 256 reglas de autómatas celulares en una dimensión. */
(function () {
  const CM = window.CM, h = CM.h, L = CM.L;
  const GALERIA = [0, 4, 18, 30, 45, 50, 54, 60, 73, 90, 105, 110, 150];

  CM.modulos.wolfram = function (el, opciones) {
    const op = Object.assign({ regla: 30 }, opciones);
    const s = { regla: op.regla, inicio: 'uno', ancho: 101, gens: 60, hoja: false, visibles: null, semilla: 1 };
    const esq = CM.esqueleto(el, op);
    const lz = CM.lienzo(esq.area);
    let fila0 = null;

    const numero = h('span', { class: 'grande mono' }, s.regla);
    const binario = h('span', { class: 'mono etiqueta' });
    const entrada = h('input', { type: 'number', id: CM.uid('regla'), min: 0, max: 255, value: s.regla, inputmode: 'numeric', 'aria-label': 'Número de regla' });
    entrada.addEventListener('input', () => {
      const v = Math.round(+entrada.value);
      if (v >= 0 && v <= 255) fijarRegla(v, true);
    });
    const dRegla = CM.deslizador({ etiqueta: 'Regla (0 a 255)', min: 0, max: 255, valor: s.regla, alCambiar: (v) => fijarRegla(v) });
    const casos = CM.casos({ regla: s.regla, editable: true, bits: true, tam: '13px', alCambiar: (v) => fijarRegla(v) });

    const dAncho = CM.deslizador({ etiqueta: 'Ancho (celdas)', min: 31, max: 401, paso: 2, valor: s.ancho, alCambiar: (v) => { s.ancho = v; fila0 = null; dibujar(); } });
    const dGens = CM.deslizador({ etiqueta: 'Generaciones', min: 10, max: 300, valor: s.gens, alCambiar: (v) => { s.gens = v; dibujar(); } });
    const inicio = CM.segmentado({
      opciones: [{ v: 'uno', t: 'Una celda negra' }, { v: 'azar', t: 'Al azar' }],
      valor: s.inicio,
      alCambiar: (v) => { s.inicio = v; s.semilla++; fila0 = null; dibujar(); },
    });
    const cHoja = CM.casilla({
      etiqueta: 'Como la hoja impresa (31 × 15)',
      valor: false,
      alCambiar: (v) => {
        s.hoja = v;
        [dAncho, dGens].forEach((d) => d.querySelector('input').toggleAttribute('disabled', v));
        fila0 = null;
        dibujar();
      },
    });

    const anim = CM.bucle(() => {
      s.visibles = (s.visibles || 0) + 1;
      dibujar();
      if (s.visibles > gens()) { s.visibles = null; return false; }
    });
    const bAnim = CM.boton('Animar', () => {
      if (anim.activo) { anim.detener(); s.visibles = null; dibujar(); return; }
      s.visibles = 0;
      anim.pps = s.hoja ? 4 : 30;
      anim.iniciar();
    }, 'principal');
    anim.alCambiar = (a) => (bAnim.textContent = a ? 'Detener' : 'Animar');

    const galeria = h('div', { class: 'fila-botones' }, GALERIA.map((r) => {
      const b = CM.boton(String(r), () => fijarRegla(r));
      b.dataset.r = r;
      return b;
    }));

    esq.controles.append(
      CM.grupo('Regla', h('div', { class: 'numero-regla' }, numero, binario), dRegla, h('label', { class: 'ctrl ctrl-numero' }, h('span', { class: 'ctrl-et' }, 'Escribe el número'), entrada)),
      CM.grupo('Los 8 casos (clic para cambiar)', casos),
      CM.grupo('Reglas de la galería', galeria),
      CM.grupo('Condición inicial', inicio, cHoja),
      CM.grupo('Tamaño', dAncho, dGens),
      CM.grupo(null, h('div', { class: 'fila-botones' }, bAnim))
    );
    const pie = h('span', null);
    esq.pie.append(pie);

    function ancho() { return s.hoja ? 31 : s.ancho; }
    function gens() { return s.hoja ? 15 : s.gens; }

    function fijarRegla(v, desdeEntrada) {
      s.regla = v;
      numero.textContent = v;
      dRegla.fijar(v);
      casos.fijar(v);
      if (!desdeEntrada) entrada.value = v;
      dibujar();
    }

    function semillaAleatoria(sem) {
      let x = sem * 2654435761 % 4294967296;
      return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296);
    }

    function dibujar() {
      const w = esq.area.clientWidth, hh = esq.area.clientHeight;
      if (!w || !hh) return;
      lz.ajustar(w, hh);
      const c = lz.ctx;
      const an = ancho(), g = gens();
      if (!fila0 || fila0.length !== an) fila0 = L.ca1dFilaInicial(an, s.inicio, semillaAleatoria(s.semilla));
      const filas = L.ca1d(s.regla, an, g, fila0);
      const tam = Math.min(w / an, hh / (g + 1));
      const ox = (w - tam * an) / 2, oy = (hh - tam * (g + 1)) / 2;
      c.clearRect(0, 0, w, hh);
      c.fillStyle = CM.token('cel-muerta');
      c.fillRect(ox, oy, tam * an, tam * (g + 1));
      const hasta = s.visibles == null ? filas.length : Math.min(filas.length, s.visibles + 1);
      c.fillStyle = CM.token('cel-viva');
      for (let t = 0; t < hasta; t++) {
        const f = filas[t];
        for (let i = 0; i < an; i++) if (f[i]) c.fillRect(ox + i * tam, oy + t * tam, Math.ceil(tam), Math.ceil(tam));
      }
      if (tam >= 6) {
        c.strokeStyle = 'rgba(40,44,52,0.35)';
        c.lineWidth = 1;
        c.beginPath();
        for (let i = 0; i <= an; i++) { const x = Math.round(ox + i * tam) + 0.5; c.moveTo(x, oy); c.lineTo(x, oy + tam * (g + 1)); }
        for (let t = 0; t <= g + 1; t++) { const y = Math.round(oy + t * tam) + 0.5; c.moveTo(ox, y); c.lineTo(ox + tam * an, y); }
        c.stroke();
        if (s.hoja) {
          c.font = `${Math.max(9, tam * 0.45)}px ${CM.token('f-mono')}`;
          c.fillStyle = CM.token('tinta-2');
          c.textAlign = 'right';
          c.textBaseline = 'middle';
          if (ox > 18) for (let t = 0; t <= g; t++) c.fillText(String(t), ox - 4, oy + t * tam + tam / 2);
        }
      }
      c.strokeStyle = CM.token('tablero-borde');
      c.lineWidth = 1.5;
      c.strokeRect(ox, oy, tam * an, tam * (g + 1));
      binario.textContent = L.binario(s.regla) + ' en binario';
      galeria.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.r === s.regla)));
      pie.innerHTML = `Regla <strong>${s.regla}</strong> · ${an} celdas · generación <strong>${Math.max(0, hasta - 1)}</strong> de ${g} · los bordes cuentan como celdas blancas.`;
    }
    CM.observar(esq.area, dibujar);
    window.addEventListener('cm-tema', dibujar);
    return { pausar: () => { if (anim.activo) { anim.detener(); s.visibles = null; dibujar(); } }, fijarRegla };
  };
})();
