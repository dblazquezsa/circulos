/* Navegación de la presentación y montaje perezoso de los módulos en cada diapositiva. */
(function () {
  const CM = window.CM;
  const diapos = Array.from(document.querySelectorAll('.diapo'));
  const total = diapos.length;
  const montados = new Map();
  const animaciones = new Map();
  let actual = 0;

  const $ = (id) => document.getElementById(id);

  function leerHash() {
    const m = /^#(\d+)$/.exec(location.hash);
    const n = m ? parseInt(m[1], 10) - 1 : 0;
    return Math.min(Math.max(n, 0), total - 1);
  }

  function ir(n) {
    n = Math.min(Math.max(n, 0), total - 1);
    const previa = diapos[actual];
    previa.classList.remove('activa');
    pausarDiapo(previa);
    actual = n;
    const d = diapos[actual];
    d.classList.add('activa');
    $('contador').textContent = `${actual + 1} / ${total}`;
    $('titulo-diapo').textContent = d.dataset.titulo || '';
    $('progreso').style.width = `${((actual + 1) / total) * 100}%`;
    $('anterior').disabled = actual === 0;
    $('siguiente').disabled = actual === total - 1;
    if (location.hash !== '#' + (actual + 1)) history.replaceState(null, '', '#' + (actual + 1));
    prepararDiapo(d);
  }

  function prepararDiapo(d) {
    d.querySelectorAll('.monta').forEach((el) => {
      if (!montados.has(el)) {
        let op = {};
        try { op = JSON.parse(el.dataset.opciones || '{}'); } catch (e) { op = {}; }
        op.compacto = true;
        montados.set(el, CM.montar(el, el.dataset.modulo, op));
      } else {
        const m = montados.get(el);
        if (el.closest('.descanso') && m && m.iniciar) m.iniciar();
      }
    });
    d.querySelectorAll('[data-regla]').forEach((el) => dibujarRegla(el));
  }

  function pausarDiapo(d) {
    d.querySelectorAll('.monta').forEach((el) => {
      const m = montados.get(el);
      if (m && m.pausar) m.pausar();
    });
    d.querySelectorAll('[data-regla]').forEach((el) => {
      const a = animaciones.get(el);
      if (a) a.detener();
    });
  }

  // Lienzo con una regla 1D; con data-animar crece generación por generación.
  function dibujarRegla(el) {
    const cv = el.querySelector('canvas');
    const regla = +el.dataset.regla;
    const ancho = el.dataset.ancho ? +el.dataset.ancho : null;
    const w = el.clientWidth, hh = el.clientHeight;
    if (!w || !hh) return;
    const d = window.devicePixelRatio || 1;
    cv.width = Math.round(w * d); cv.height = Math.round(hh * d);
    cv.style.width = w + 'px'; cv.style.height = hh + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const tam = el.dataset.tam ? +el.dataset.tam : ancho ? Math.max(1, w / ancho) : Math.max(3, Math.min(8, Math.round(w / 140)));
    const op = { tam, ancho: Math.ceil(w / tam) };
    if (el.dataset.inicio === 'azar') Object.assign(op, { azar: true, periodico: true, semilla: 11, descartar: el.dataset.descartar != null ? +el.dataset.descartar : 40 });
    if (el.dataset.paleta === 'concha') Object.assign(op, { viva: '#6e3512', muerta: '#f8efe1' });
    if (el.dataset.animar && !CM.reducirMovimiento) {
      let filas = 0;
      const prev = animaciones.get(el);
      if (prev) prev.detener();
      const b = CM.bucle(() => {
        filas++;
        const r = CM.dibujarRegla(ctx, w, hh, regla, filas, op);
        if (filas >= r.gens) return false;
      });
      b.pps = 40;
      animaciones.set(el, b);
      b.iniciar();
    } else {
      CM.dibujarRegla(ctx, w, hh, regla, null, op);
    }
  }

  // Autómata humano: los 8 casos de la regla elegida
  const REGLAS = [90, 30, 0, 4, 18, 45, 50, 54, 60, 73, 105, 110, 150];
  const casosHumano = CM.casos({ regla: 90, tam: '48px' });
  $('casos-humano').append(casosHumano);
  const textos = {
    90: 'Regla 90: negro si exactamente uno de tus dos vecinos es negro.',
    30: 'Regla 30: mira los 8 casos; nadie sabe qué va a salir.',
  };
  function textoRegla(r) {
    return textos[r] || `Regla ${r}: busca tu caso entre los 8 y voltea según la casilla de abajo.`;
  }
  const selHumano = CM.segmentado({
    opciones: REGLAS.map((r) => ({ v: String(r), t: String(r) })),
    valor: '90',
    alCambiar: (v) => {
      casosHumano.fijar(+v);
      $('texto-humano').textContent = textoRegla(+v);
      $('binario-humano').textContent = CM.L.binario(+v).split('').join(' ');
    },
  });
  $('botones-humano').append(selHumano);
  $('texto-humano').textContent = textoRegla(90);
  $('binario-humano').textContent = CM.L.binario(90).split('').join(' ');

  // Una regla es un número: código de la regla 90
  $('casos-codigo').append(CM.casos({ regla: 90, bits: true, tam: '44px' }));

  // Fotos de la concha: si falta el archivo, se muestra un aviso
  document.querySelectorAll('img[data-foto]').forEach((img) => {
    const aviso = () => { img.hidden = true; img.nextElementSibling.hidden = false; };
    img.addEventListener('error', aviso);
    if (img.complete && img.naturalWidth === 0) aviso();
  });

  // Código QR
  const url = CM.urlSitio();
  $('url-cierre').textContent = url || 'Publica el sitio para ver aquí su dirección.';
  if (!CM.dibujarQR($('qr-cierre'), url)) $('qr-cierre').hidden = true;

  // Controles
  $('anterior').addEventListener('click', () => ir(actual - 1));
  $('siguiente').addEventListener('click', () => ir(actual + 1));
  $('pantalla').addEventListener('click', () => {
    const doc = document.documentElement;
    try {
      if (!document.fullscreenElement) doc.requestFullscreen && doc.requestFullscreen().catch(() => {});
      else document.exitFullscreen && document.exitFullscreen().catch(() => {});
    } catch (e) { /* algunos navegadores no lo permiten */ }
  });

  document.addEventListener('keydown', (ev) => {
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const k = ev.key;
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && t.tagName !== 'BUTTON')) { ev.preventDefault(); ir(actual + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { ev.preventDefault(); ir(actual - 1); }
    else if (k === 'Home') { ev.preventDefault(); ir(0); }
    else if (k === 'End') { ev.preventDefault(); ir(total - 1); }
    else if (k === 'f' || k === 'F') $('pantalla').click();
  });

  window.addEventListener('hashchange', () => { const n = leerHash(); if (n !== actual) ir(n); });
  window.addEventListener('resize', () => diapos[actual].querySelectorAll('[data-regla]').forEach((el) => dibujarRegla(el)));

  actual = leerHash();
  diapos.forEach((d) => d.classList.remove('activa'));
  diapos[actual].classList.add('activa');
  ir(actual);
})();
