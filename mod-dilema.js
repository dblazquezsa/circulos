/* Módulo 5: Dilema del Prisionero espacial (Nowak y May). */
(function () {
  const CM = window.CM, h = CM.h, L = CM.L;

  CM.modulos.dilema = function (el, opciones) {
    const op = Object.assign({ n: 5, escenario: 'B' }, opciones);
    const s = {
      n: op.n,
      escenario: op.escenario,
      pagos: { R: 3, T: 5, S: 0, P: 1 },
      moore: false,
      propio: false,
      mezclar: false,
      transicion: false,
      dinamica: op.dinamica || 'nowak',
      puntos: false,
      ronda: 0,
    };
    let est, previo = null, puntos = null, historia = [];
    const esq = CM.esqueleto(el, op);
    const lz = CM.lienzo(esq.area);
    let geo = { lado: 1, ox: 0, oy: 0, margen: 0 };

    function opcionesPaso() {
      return { pagos: s.pagos, moore: s.moore, propio: s.propio, mezclar: s.mezclar, dinamica: s.dinamica };
    }
    function reiniciar(nombre) {
      if (nombre) s.escenario = nombre;
      est = L.escenario(s.escenario, s.n);
      previo = null;
      s.ronda = 0;
      historia = [porcentaje()];
      calcularPuntos();
      marcarEscenario();
      dibujar();
    }
    function porcentaje() { return (100 * L.contar(est)) / (s.n * s.n); }
    function calcularPuntos() { puntos = s.mezclar ? null : L.dilemaPuntos(est, s.n, opcionesPaso()).pts; }
    function paso() {
      const r = L.dilemaPaso(est, s.n, opcionesPaso());
      previo = est;
      est = r.nuevo;
      s.ronda++;
      historia.push(porcentaje());
      calcularPuntos();
      dibujar();
      let cambio = false;
      for (let k = 0; k < est.length; k++) if (est[k] !== previo[k]) { cambio = true; break; }
      return cambio || s.mezclar;
    }

    const bucle = CM.bucle(() => { if (!paso() || s.ronda >= 400) return false; });
    bucle.pps = 3;
    const bPlay = CM.botonPlay(bucle, ['Animar', 'Pausar']);
    const dVel = CM.deslizador({ etiqueta: 'Velocidad (rondas por segundo)', min: 1, max: 30, valor: 3, alCambiar: (v) => (bucle.pps = v) });

    const nR = CM.numero({ etiqueta: 'R', valor: s.pagos.R, paso: 0.05, alCambiar: (v) => cambiarPago('R', v) });
    const nT = CM.numero({ etiqueta: 'T', valor: s.pagos.T, paso: 0.05, alCambiar: (v) => cambiarPago('T', v) });
    const nS = CM.numero({ etiqueta: 'S', valor: s.pagos.S, paso: 0.05, alCambiar: (v) => cambiarPago('S', v) });
    const nP = CM.numero({ etiqueta: 'P', valor: s.pagos.P, paso: 0.05, alCambiar: (v) => cambiarPago('P', v) });
    const dT = CM.deslizador({ etiqueta: 'Tentación de traicionar (T)', min: 0, max: 8, paso: 0.05, valor: s.pagos.T, formato: (v) => (+v).toFixed(2), alCambiar: (v) => { cambiarPago('T', v); nT.fijar(v); } });
    function cambiarPago(k, v) { s.pagos[k] = v; if (k === 'T') dT.fijar(v); calcularPuntos(); dibujar(); }
    function fijarPagos(p) { Object.assign(s.pagos, p); nR.fijar(p.R); nT.fijar(p.T); nS.fijar(p.S); nP.fijar(p.P); dT.fijar(p.T); }

    const dN = CM.deslizador({ etiqueta: 'Tamaño de la cuadrícula', min: 5, max: 61, valor: s.n, formato: (v) => `${v} × ${v}`, alCambiar: (v) => { bucle.detener(); s.n = v; reiniciar(); } });
    const vec = CM.segmentado({ opciones: [{ v: '4', t: '4 vecinos' }, { v: '8', t: '8 vecinos' }], valor: '4', alCambiar: (v) => { s.moore = v === '8'; calcularPuntos(); dibujar(); } });
    const cPropio = CM.casilla({ etiqueta: 'Jugar también contra sí mismo', valor: false, alCambiar: (v) => { s.propio = v; calcularPuntos(); dibujar(); } });
    const cMezclar = CM.casilla({ etiqueta: 'Mezclar: jugar con desconocidos al azar', valor: false, alCambiar: (v) => { s.mezclar = v; calcularPuntos(); dibujar(); } });
    const cTrans = CM.casilla({ etiqueta: 'Colores de transición', valor: false, alCambiar: (v) => { s.transicion = v; dibujar(); } });
    const cPuntos = CM.casilla({ etiqueta: 'Mostrar puntos (hasta 10 × 10)', valor: false, alCambiar: (v) => { s.puntos = v; dibujar(); } });

    const escenarios = h('div', { class: 'fila-botones' },
      [['A', 'A · un traidor'], ['B', 'B · barrio cooperador'], ['C', 'C · mitad y mitad'], ['azar', 'Al azar']].map(([k, t]) => {
        const b = CM.boton(t, () => { bucle.detener(); reiniciar(k); });
        b.dataset.e = k;
        return b;
      })
    );
    function marcarEscenario() { escenarios.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.e === s.escenario))); }

    const selDin = CM.selectorDinamica({ valor: s.dinamica, alCambiar: (v) => { s.dinamica = v; } });
    const bCaleido = CM.boton('Caleidoscopio', () => {
      bucle.detener();
      s.dinamica = 'nowak'; selDin.fijar('nowak');
      fijarPagos({ R: 1, T: 1.85, S: 0, P: 0 });
      s.n = 61; dN.fijar(61);
      s.moore = true; vec.fijar('8');
      s.propio = true; cPropio.fijar(true);
      s.mezclar = false; cMezclar.fijar(false);
      s.transicion = true; cTrans.fijar(true);
      reiniciar('caleidoscopio');
      bucle.pps = 12; dVel.fijar(12);
      bucle.iniciar();
    });
    const bSalon = CM.boton('Como en el salón', () => {
      bucle.detener();
      s.dinamica = 'nowak'; selDin.fijar('nowak');
      fijarPagos({ R: 3, T: 5, S: 0, P: 1 });
      s.n = 5; dN.fijar(5);
      s.moore = false; vec.fijar('4');
      s.propio = false; cPropio.fijar(false);
      s.mezclar = false; cMezclar.fijar(false);
      bucle.pps = 2; dVel.fijar(2);
      reiniciar('B');
    });

    const tabla = h('div', { class: 'tabla-pagos-mini mono' });
    function pintarTabla() {
      tabla.innerHTML = `<span></span><span>✓</span><span>✗</span><span>✓</span><span>${s.pagos.R}</span><span>${s.pagos.S}</span><span>✗</span><span>${s.pagos.T}</span><span>${s.pagos.P}</span>`;
    }

    esq.controles.append(
      CM.grupo('Reglas', h('p', null, '✓ coopera, ✗ traiciona. Cada uno juega con sus vecinos y suma sus puntos. Con empate, cada uno se queda con lo que tenía.')),
      selDin,
      CM.grupo('Rondas', h('div', { class: 'fila-botones' }, CM.boton('Una ronda', () => { bucle.detener(); paso(); }), bPlay, CM.boton('Reiniciar', () => { bucle.detener(); reiniciar(); })), dVel),
      CM.grupo('Posición inicial', escenarios, h('p', { class: 'etiqueta' }, 'Clic en una casilla para cambiarla')),
      CM.grupo('Pagos (para mí, según lo que juegue mi vecino)', tabla, h('div', { class: 'rejilla-numeros' }, nR, nT, nS, nP), dT),
      CM.grupo('Red', dN, vec, cPropio, cMezclar),
      CM.grupo('Vista', cTrans, cPuntos),
      CM.grupo('Configuraciones', h('div', { class: 'fila-botones' }, bSalon, bCaleido))
    );
    const leyenda = h('div', { class: 'leyenda' });
    const pie = h('span', null);
    esq.pie.append(pie, leyenda);
    const graf = CM.grafica(esq.vista, 'Cooperadores', 'verde');

    lz.cv.addEventListener('click', (ev) => {
      const k = CM.celdaEn(lz.cv, geo, s.n, ev);
      if (k < 0) return;
      bucle.detener();
      est[k] ^= 1;
      previo = null;
      s.ronda = 0;
      historia = [porcentaje()];
      calcularPuntos();
      dibujar();
    });

    function dibujar() {
      const w = esq.area.clientWidth, hh = esq.area.clientHeight;
      if (!w || !hh || !est) return;
      lz.ajustar(w, hh);
      const ctx = lz.ctx, n = s.n;
      const rot = n <= 10;
      geo = CM.geometria(w, hh, n, rot);
      ctx.clearRect(0, 0, w, hh);
      if (rot) CM.dibujarRotulos(ctx, geo, n);
      const C = {
        v: CM.token('verde'), r: CM.token('rojo'), vc: CM.token('verde-claro'), na: CM.token('naranja'),
      };
      const sep = geo.lado > 12 ? Math.max(1, geo.lado * 0.06) : 0;
      const simbolos = geo.lado >= 22;
      const conPuntos = s.puntos && n <= 10 && puntos;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const k = i * n + j;
          const x = geo.ox + j * geo.lado, y = geo.oy + i * geo.lado;
          let color = est[k] ? C.v : C.r;
          if (s.transicion && previo) {
            if (est[k] && !previo[k]) color = C.vc;
            else if (!est[k] && previo[k]) color = C.na;
          }
          ctx.fillStyle = color;
          ctx.fillRect(x + sep, y + sep, geo.lado - 2 * sep, geo.lado - 2 * sep);
          if (simbolos) {
            const claro = color === C.vc || color === C.na;
            ctx.fillStyle = claro ? '#15171c' : '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const cy = conPuntos ? y + geo.lado * 0.38 : y + geo.lado / 2;
            ctx.font = `800 ${geo.lado * (conPuntos ? 0.36 : 0.46)}px ${CM.token('f-texto')}`;
            ctx.fillText(est[k] ? '✓' : '✗', x + geo.lado / 2, cy);
            if (conPuntos) {
              ctx.font = `700 ${geo.lado * 0.22}px ${CM.token('f-mono')}`;
              ctx.fillText(formatear(puntos[k]), x + geo.lado / 2, y + geo.lado * 0.74);
            }
          }
        }
      }
      const pc = historia[historia.length - 1];
      pie.innerHTML = `Ronda <strong>${s.ronda}</strong> · cooperadores <strong>${L.contar(est)}</strong> de ${n * n} (${Math.round(pc)} %)` + (s.mezclar ? ' · modo mezclado' : '');
      const items = [['v', 'coopera ✓'], ['r', 'traiciona ✗']];
      if (s.transicion) items.push(['vc', 'acaba de pasar a cooperar'], ['na', 'acaba de pasar a traicionar']);
      leyenda.replaceChildren(...items.map(([t, txt]) => h('span', null, h('i', { style: { background: C[t] } }), txt)));
      pintarTabla();
      graf.fijar(historia);
    }
    function formatear(v) { return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, ''); }

    CM.observar(esq.area, dibujar);
    window.addEventListener('cm-tema', dibujar);
    reiniciar(s.escenario);
    return { pausar: () => bucle.detener() };
  };
})();
