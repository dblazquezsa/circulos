/* Módulo 4: Juego de la Coordinación en una red cuadriculada. */
(function () {
  const CM = window.CM, h = CM.h, L = CM.L;

  CM.modulos.coordinacion = function (el, opciones) {
    const op = Object.assign({ n: 30 }, opciones);
    const s = { n: op.n, ronda: 0, herramienta: 'color', dinamica: op.dinamica || 'nash' };
    let col, terco, inicial, anterior = null;
    const esq = CM.esqueleto(el, op);
    const lz = CM.lienzo(esq.area);
    let geo = { lado: 1, ox: 0, oy: 0, margen: 0 };

    function nuevo(n, tipo) {
      s.n = n;
      col = new Uint8Array(n * n);
      terco = new Uint8Array(n * n);
      if (tipo !== 'vacio') for (let k = 0; k < n * n; k++) col[k] = Math.random() < 0.5 ? 1 : 0;
      guardarInicial();
    }
    function guardarInicial() {
      s.ronda = 0;
      anterior = null;
      inicial = { col: col.slice(), terco: terco.slice() };
      dibujar();
    }
    function paso() {
      const nc = L.juegoPaso(col, s.n, { pagoFn: L.pagoCoord, dinamica: s.dinamica, terco }).nuevo;
      const igual = (a, b) => { if (!a) return false; for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return false; return true; };
      // Se detiene si nada cambia o si el tablero alterna entre dos estados.
      const cambio = !igual(col, nc) && !igual(anterior, nc);
      anterior = col;
      col = nc;
      s.ronda++;
      dibujar();
      return cambio;
    }

    const bucle = CM.bucle(() => { if (!paso()) return false; });
    bucle.pps = 3;
    const bPlay = CM.botonPlay(bucle, ['Animar', 'Pausar']);
    const dN = CM.deslizador({ etiqueta: 'Tamaño de la cuadrícula', min: 5, max: 50, valor: s.n, formato: (v) => `${v} × ${v}`, alCambiar: (v) => { bucle.detener(); nuevo(v); } });
    const herr = CM.segmentado({
      opciones: [{ v: 'color', t: 'Cambiar color' }, { v: 'terco', t: 'Marcar terco' }],
      valor: 'color',
      alCambiar: (v) => (s.herramienta = v),
    });

    esq.controles.append(
      CM.grupo('Reglas', h('p', null, 'Ganas 1 punto por cada vecino con tu mismo color. Con empate, cada uno se queda con su color. Los tercos nunca cambian.')),
      CM.selectorDinamica({ valor: s.dinamica, alCambiar: (v) => { s.dinamica = v; anterior = null; } }),
      CM.grupo('Rondas', h('div', { class: 'fila-botones' }, CM.boton('Una ronda', () => { bucle.detener(); paso(); }), bPlay, CM.boton('Volver a la ronda 0', () => { bucle.detener(); col = inicial.col.slice(); terco = inicial.terco.slice(); s.ronda = 0; dibujar(); }))),
      CM.grupo('Tablero', dN, h('div', { class: 'fila-botones' }, CM.boton('5 × 5', () => { bucle.detener(); dN.fijar(5); nuevo(5); }), CM.boton('Colores al azar', () => { bucle.detener(); nuevo(s.n); }), CM.boton('Todo azul', () => { bucle.detener(); nuevo(s.n, 'vacio'); col.fill(1); guardarInicial(); }))),
      CM.grupo('Al hacer clic en una casilla', herr, h('p', { class: 'etiqueta' }, 'Los cambios a mano definen una nueva ronda 0'))
    );
    const pie = h('span', null);
    esq.pie.append(pie);

    lz.cv.addEventListener('click', (ev) => {
      const k = CM.celdaEn(lz.cv, geo, s.n, ev);
      if (k < 0) return;
      bucle.detener();
      if (s.herramienta === 'terco') terco[k] ^= 1;
      else col[k] ^= 1;
      guardarInicial();
    });

    function dibujar() {
      const w = esq.area.clientWidth, hh = esq.area.clientHeight;
      if (!w || !hh || !col) return;
      lz.ajustar(w, hh);
      const ctx = lz.ctx, n = s.n;
      const rot = n <= 10;
      geo = CM.geometria(w, hh, n, rot);
      ctx.clearRect(0, 0, w, hh);
      if (rot) CM.dibujarRotulos(ctx, geo, n);
      const az = CM.token('azul'), am = CM.token('amarillo'), borde = CM.token('tablero-borde');
      const sep = geo.lado > 12 ? Math.max(1, geo.lado * 0.06) : 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const k = i * n + j;
          const x = geo.ox + j * geo.lado, y = geo.oy + i * geo.lado;
          ctx.fillStyle = col[k] ? az : am;
          ctx.fillRect(x + sep, y + sep, geo.lado - 2 * sep, geo.lado - 2 * sep);
          if (terco[k]) {
            ctx.strokeStyle = borde;
            ctx.lineWidth = Math.max(2, geo.lado * 0.09);
            const m = geo.lado * 0.22;
            ctx.strokeRect(x + m, y + m, geo.lado - 2 * m, geo.lado - 2 * m);
          }
        }
      }
      const p = L.coordParejas(col, n);
      const azules = L.contar(col);
      pie.innerHTML = `Ronda <strong>${s.ronda}</strong> · parejas de vecinos con el mismo color <strong>${p.iguales}</strong> de ${p.total} (${Math.round((100 * p.iguales) / p.total)} %) · azules <strong>${azules}</strong>, amarillos <strong>${n * n - azules}</strong>` + ` · tercos <strong>${L.contar(terco)}</strong>`;
    }

    CM.observar(esq.area, dibujar);
    window.addEventListener('cm-tema', dibujar);
    nuevo(s.n);
    return { pausar: () => bucle.detener() };
  };
})();
