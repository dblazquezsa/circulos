/* Módulo 1: Triángulo de Pascal coloreado según el residuo módulo n. */
(function () {
  const CM = window.CM, h = CM.h, L = CM.L;

  // Un color por residuo; el 0 siempre en blanco.
  const COLORES = ['#ffffff', '#111214', '#5a3ff0', '#e4572e', '#17a6a3', '#e8b100', '#5f9e2f', '#b03a8c', '#2e7fb8', '#8a5a2b'];
  const COLOR_MOD2 = ['#ffffff', '#111214'];

  CM.coloresPascal = (n) => (n === 2 ? COLOR_MOD2 : COLORES.slice(0, n));

  CM.dibujarPascal = function (ctx, w, hh, filas, n, opciones) {
    const op = opciones || {};
    const res = L.pascalResiduos(filas, n);
    const nums = op.numeros ? L.pascalNumeros(filas) : null;
    const visibles = op.visibles == null ? filas : op.visibles;
    const colores = op.sinColor ? ['#ffffff'] : CM.coloresPascal(n);
    // Hexágonos con punta arriba: ancho a, alto 2a/√3, separación vertical 0.866·a
    const a = Math.min(w / filas, (hh - 4) / (filas * 0.866 + 0.3));
    const alto = (2 * a) / Math.sqrt(3);
    const totalH = (filas - 1) * 0.866 * a + alto;
    const oy = (hh - totalH) / 2 + alto / 2;
    ctx.clearRect(0, 0, w, hh);
    const borde = CM.token('tablero-borde');
    const conBorde = a >= 7;
    ctx.lineWidth = a > 20 ? 1.25 : 0.75;
    ctx.strokeStyle = borde;
    for (let r = 0; r < visibles; r++) {
      const y = oy + r * 0.866 * a;
      const x0 = w / 2 - (r * a) / 2;
      for (let k = 0; k <= r; k++) {
        const cx = x0 + k * a;
        hexagono(ctx, cx, y, a, alto);
        const rk = op.sinColor ? 0 : res[r][k];
        ctx.fillStyle = colores[rk];
        ctx.fill();
        if (conBorde) ctx.stroke();
        if (nums) {
          const v = nums[r][k];
          const txt = String(v);
          const fs = Math.min(a * 0.42, (a * 1.6) / Math.max(txt.length, 2));
          ctx.font = `700 ${fs}px ${CM.token('f-mono')}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = rk === 0 || rk === 5 ? '#111214' : '#ffffff';
          ctx.fillText(txt, cx, y + 1);
        }
      }
    }
  };

  function hexagono(ctx, cx, cy, a, alto) {
    const m = a / 2, q = alto / 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy - alto / 2);
    ctx.lineTo(cx + m, cy - q);
    ctx.lineTo(cx + m, cy + q);
    ctx.lineTo(cx, cy + alto / 2);
    ctx.lineTo(cx - m, cy + q);
    ctx.lineTo(cx - m, cy - q);
    ctx.closePath();
  }

  CM.modulos.pascal = function (el, opciones) {
    const op = Object.assign({ filas: 32, n: 2, numeros: false, sinColor: false }, opciones);
    const s = { filas: op.filas, n: op.n, numeros: !!op.numeros && op.filas <= 16, sinColor: !!op.sinColor, visibles: op.filas };
    const esq = CM.esqueleto(el, op);
    const lz = CM.lienzo(esq.area);

    const leyenda = h('div', { class: 'leyenda' });
    const dFilas = CM.deslizador({ etiqueta: 'Filas', min: 8, max: 128, valor: s.filas, alCambiar: (v) => { s.filas = v; s.visibles = v; if (v > 16) { s.numeros = false; cNum.fijar(false); } cNum.input.disabled = v > 16; dibujar(); } });
    const dMod = CM.deslizador({ etiqueta: 'Módulo n', min: 2, max: 10, valor: s.n, alCambiar: (v) => { s.n = v; s.sinColor = false; dibujar(); } });
    const cNum = CM.casilla({ etiqueta: 'Mostrar los números (hasta 16 filas)', valor: s.numeros, alCambiar: (v) => { s.numeros = v; dibujar(); } });
    cNum.input.disabled = s.filas > 16;

    const crecer = CM.bucle(() => {
      s.visibles++;
      dibujar();
      if (s.visibles >= s.filas) return false;
    });
    const bCrecer = CM.boton('Crecer fila por fila', () => {
      if (crecer.activo) { crecer.detener(); return; }
      s.visibles = 0;
      crecer.pps = Math.max(6, Math.round(s.filas / 4));
      crecer.iniciar();
    }, 'principal');
    crecer.alCambiar = (a) => (bCrecer.textContent = a ? 'Detener' : 'Crecer fila por fila');

    const atajos = CM.segmentado({
      opciones: [{ v: 'sin', t: 'Sin color' }, { v: 2, t: 'mod 2' }, { v: 3, t: 'mod 3' }, { v: 5, t: 'mod 5' }],
      valor: s.sinColor ? 'sin' : s.n,
      alCambiar: (v) => {
        if (v === 'sin') s.sinColor = true;
        else { s.sinColor = false; s.n = +v; dMod.fijar(s.n); }
        dibujar();
      },
    });

    esq.controles.append(
      CM.grupo('Triángulo', dFilas, cNum),
      CM.grupo('Colorear por residuo', dMod, atajos, leyenda),
      CM.grupo('Animación', h('div', { class: 'fila-botones' }, bCrecer))
    );
    const pie = h('span', null);
    esq.pie.append(pie);

    function dibujar() {
      const w = esq.area.clientWidth, hh = esq.area.clientHeight;
      if (!w || !hh) return;
      lz.ajustar(w, hh);
      CM.dibujarPascal(lz.ctx, w, hh, s.filas, s.n, { numeros: s.numeros, visibles: s.visibles, sinColor: s.sinColor });
      atajos.fijar(s.sinColor ? 'sin' : s.n);
      const cols = CM.coloresPascal(s.n);
      leyenda.hidden = s.sinColor;
      leyenda.replaceChildren(...cols.map((c, i) => h('span', null, h('i', { style: { background: c } }), 'residuo ' + i)));
      pie.innerHTML = (s.sinColor ? 'Cada celda es la suma de las dos de arriba.' : `Cada celda es la suma de las dos de arriba. Se colorea según el residuo al dividir entre <strong>${s.n}</strong>.`) + ` Filas: <strong>${s.visibles}</strong> de ${s.filas}.`;
    }
    CM.observar(esq.area, dibujar);
    window.addEventListener('cm-tema', dibujar);
    return { pausar: () => crecer.detener(), dibujar };
  };
})();
