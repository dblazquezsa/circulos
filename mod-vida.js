/* Módulo 3: Juego de la Vida de Conway. */
(function () {
  const CM = window.CM, h = CM.h, L = CM.L;

  const PATRONES = {
    planeador: { t: 'Planeador', rle: 'bo$2bo$3o!', pos: [0.15, 0.15] },
    intermitente: { t: 'Intermitente', rle: '3o!', pos: [0.5, 0.5] },
    nave: { t: 'Nave ligera', rle: 'o2bo$4bo$o3bo$b4o!', pos: [0.08, 0.5] },
    gosper: { t: 'Cañón de Gosper', rle: '24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!', pos: [0.04, 0.06] },
    rpentomino: { t: 'R-pentomino', rle: 'b2o$2o$bo!', pos: [0.5, 0.5] },
  };
  CM.patronesVida = PATRONES;

  CM.modulos.vida = function (el, opciones) {
    const op = Object.assign({ w: 80, h: 50, patron: 'gosper', soloVista: false }, opciones);
    const W = op.w, H = op.h;
    let c = new Uint8Array(W * H);
    let gen = 0;
    const esq = CM.esqueleto(el, op);
    if (op.soloVista) { esq.controles.hidden = true; esq.raiz.style.gridTemplateColumns = '1fr'; }
    const lz = CM.lienzo(esq.area);
    let geo = { lado: 1, ox: 0, oy: 0 };

    function cargar(nombre) {
      c = new Uint8Array(W * H);
      gen = 0;
      const p = PATRONES[nombre];
      const celdas = L.rle(p.rle);
      const ancho = Math.max(...celdas.map((q) => q[0])) + 1, alto = Math.max(...celdas.map((q) => q[1])) + 1;
      const x0 = Math.round(p.pos[0] * W - (p.pos[0] === 0.5 ? ancho / 2 : 0));
      const y0 = Math.round(p.pos[1] * H - (p.pos[1] === 0.5 ? alto / 2 : 0));
      for (const [x, y] of celdas) {
        const xx = x0 + x, yy = y0 + y;
        if (xx >= 0 && xx < W && yy >= 0 && yy < H) c[yy * W + xx] = 1;
      }
      dibujar();
    }
    function azar() {
      c = new Uint8Array(W * H);
      for (let k = 0; k < c.length; k++) c[k] = Math.random() < 0.28 ? 1 : 0;
      gen = 0;
      dibujar();
    }
    function paso() {
      c = L.vidaPaso(c, W, H);
      gen++;
      dibujar();
    }

    const bucle = CM.bucle(paso);
    bucle.pps = 10;
    const bPlay = CM.botonPlay(bucle, ['Iniciar', 'Pausar']);
    const dVel = CM.deslizador({ etiqueta: 'Velocidad (generaciones por segundo)', min: 1, max: 30, valor: 10, alCambiar: (v) => (bucle.pps = v) });
    const patrones = h('div', { class: 'fila-botones' }, Object.entries(PATRONES).map(([k, p]) => CM.boton(p.t, () => { bucle.detener(); cargar(k); })));

    esq.controles.append(
      CM.grupo('Reglas', h('p', null, 'Una celda muerta nace con exactamente 3 vecinas vivas. Una viva sobrevive con 2 o 3. Si no, muere.')),
      CM.grupo('Simulación', h('div', { class: 'fila-botones' }, bPlay, CM.boton('Un paso', () => { bucle.detener(); paso(); })), dVel),
      CM.grupo('Patrones', patrones),
      CM.grupo('Tablero', h('div', { class: 'fila-botones' }, CM.boton('Aleatorio', () => azar()), CM.boton('Limpiar', () => { bucle.detener(); c = new Uint8Array(W * H); gen = 0; dibujar(); })), h('p', { class: 'etiqueta' }, 'Dibuja con el mouse o el dedo'))
    );
    const pie = h('span', null);
    esq.pie.append(pie);

    // Dibujo a mano
    let pintando = -1;
    function celda(ev) {
      const r = lz.cv.getBoundingClientRect();
      const x = Math.floor((ev.clientX - r.left - geo.ox) / geo.lado), y = Math.floor((ev.clientY - r.top - geo.oy) / geo.lado);
      if (x < 0 || y < 0 || x >= W || y >= H) return -1;
      return y * W + x;
    }
    lz.cv.addEventListener('pointerdown', (ev) => {
      if (op.soloVista) return;
      const k = celda(ev);
      if (k < 0) return;
      pintando = c[k] ? 0 : 1;
      c[k] = pintando;
      lz.cv.setPointerCapture(ev.pointerId);
      dibujar();
    });
    lz.cv.addEventListener('pointermove', (ev) => {
      if (pintando < 0) return;
      const k = celda(ev);
      if (k >= 0 && c[k] !== pintando) { c[k] = pintando; dibujar(); }
    });
    const fin = () => (pintando = -1);
    lz.cv.addEventListener('pointerup', fin);
    lz.cv.addEventListener('pointercancel', fin);

    function dibujar() {
      const w = esq.area.clientWidth, hh = esq.area.clientHeight;
      if (!w || !hh) return;
      if (lz.cv.width !== Math.round(Math.floor(w) * (window.devicePixelRatio || 1)) || lz.cv.height !== Math.round(Math.floor(hh) * (window.devicePixelRatio || 1))) lz.ajustar(w, hh);
      const ctx = lz.ctx;
      const lado = Math.min(w / W, hh / H);
      geo = { lado, ox: (w - lado * W) / 2, oy: (hh - lado * H) / 2 };
      ctx.clearRect(0, 0, w, hh);
      ctx.fillStyle = CM.token('cel-muerta');
      ctx.fillRect(geo.ox, geo.oy, lado * W, lado * H);
      if (lado >= 7) {
        ctx.strokeStyle = 'rgba(40,44,52,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 1; x < W; x++) { const X = Math.round(geo.ox + x * lado) + 0.5; ctx.moveTo(X, geo.oy); ctx.lineTo(X, geo.oy + lado * H); }
        for (let y = 1; y < H; y++) { const Y = Math.round(geo.oy + y * lado) + 0.5; ctx.moveTo(geo.ox, Y); ctx.lineTo(geo.ox + lado * W, Y); }
        ctx.stroke();
      }
      ctx.fillStyle = CM.token('cel-viva');
      const g = lado > 6 ? 1 : 0;
      let vivas = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (c[y * W + x]) { vivas++; ctx.fillRect(geo.ox + x * lado + g, geo.oy + y * lado + g, lado - 2 * g, lado - 2 * g); }
      ctx.strokeStyle = CM.token('tablero-borde');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(geo.ox, geo.oy, lado * W, lado * H);
      pie.innerHTML = `Generación <strong>${gen}</strong> · células vivas <strong>${vivas}</strong> · tablero ${W} × ${H}, fuera del borde todo está muerto.`;
    }

    CM.observar(esq.area, () => { lz.ajustar(esq.area.clientWidth, esq.area.clientHeight); dibujar(); });
    window.addEventListener('cm-tema', dibujar);
    if (op.patron === 'azar') azar(); else cargar(op.patron);
    if (op.autoplay) bucle.iniciar();
    return { pausar: () => bucle.detener(), iniciar: () => bucle.iniciar(), azar };
  };
})();
