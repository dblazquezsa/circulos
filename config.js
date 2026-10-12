/* Configuración del sitio.
   Cuando publiques en GitHub Pages, escribe aquí la dirección final para que el código QR la muestre,
   por ejemplo: 'https://tu-usuario.github.io/automatas-y-agentes/'.
   Si se deja vacía, se usa la dirección desde la que se abrió la página. */
window.CM = window.CM || {};
window.CM.config = {
  urlSitio: '',
};

window.CM.urlSitio = function () {
  const u = (window.CM.config && window.CM.config.urlSitio) || '';
  if (u) return u;
  const l = window.location;
  if (l.protocol === 'file:') return '';
  return l.origin + l.pathname.replace(/[^/]*$/, '').replace(/modulos\/$/, '');
};

window.CM.dibujarQR = function (el, url) {
  if (!url || typeof window.qrcode !== 'function') {
    el.textContent = '';
    return false;
  }
  const qr = window.qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  el.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  const svg = el.querySelector('svg');
  if (svg) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Código QR de ' + url); }
  return true;
};
