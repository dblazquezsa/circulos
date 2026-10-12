/* Lógica pura de los modelos (sin dibujo). Se usa en el navegador y en pruebas con Node. */
(function (g) {
  const L = {};

  /* ---------- Triángulo de Pascal ---------- */
  L.pascalResiduos = function (filas, n) {
    const out = [];
    let fila = [1 % n];
    for (let r = 0; r < filas; r++) {
      out.push(fila);
      const nf = [1 % n];
      for (let k = 1; k <= r; k++) nf.push((fila[k - 1] + fila[k]) % n);
      nf.push(1 % n);
      fila = nf;
    }
    return out;
  };

  L.pascalNumeros = function (filas) {
    const out = [];
    let fila = [1];
    for (let r = 0; r < filas; r++) {
      out.push(fila);
      const nf = [1];
      for (let k = 1; k <= r; k++) nf.push(fila[k - 1] + fila[k]);
      nf.push(1);
      fila = nf;
    }
    return out;
  };

  /* ---------- Autómatas de Wolfram (1D) ---------- */
  // Bordes fijos en blanco (0), como en la fila de estudiantes y en la hoja impresa.
  L.ca1dFilaInicial = function (ancho, tipo, rnd) {
    const f = new Uint8Array(ancho);
    if (tipo === 'azar') {
      const r = rnd || Math.random;
      for (let i = 0; i < ancho; i++) f[i] = r() < 0.5 ? 1 : 0;
    } else {
      f[Math.floor(ancho / 2)] = 1;
    }
    return f;
  };

  L.ca1dPaso = function (regla, f, periodico) {
    const n = f.length;
    const nf = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const l = i > 0 ? f[i - 1] : (periodico ? f[n - 1] : 0);
      const c = f[i];
      const r = i < n - 1 ? f[i + 1] : (periodico ? f[0] : 0);
      nf[i] = (regla >> (l * 4 + c * 2 + r)) & 1;
    }
    return nf;
  };

  L.ca1d = function (regla, ancho, generaciones, inicio, periodico) {
    const filas = [inicio || L.ca1dFilaInicial(ancho, 'uno')];
    for (let t = 0; t < generaciones; t++) filas.push(L.ca1dPaso(regla, filas[filas.length - 1], periodico));
    return filas;
  };

  L.binario = function (regla) {
    return regla.toString(2).padStart(8, '0');
  };

  /* ---------- Juego de la Vida ---------- */
  // Bordes muertos: lo que sale de la cuadrícula desaparece.
  L.vidaPaso = function (c, w, h) {
    const n = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            v += c[yy * w + xx];
          }
        }
        const viva = c[y * w + x];
        n[y * w + x] = (v === 3 || (viva && v === 2)) ? 1 : 0;
      }
    }
    return n;
  };

  // Lee un patrón en formato RLE (b = muerta, o = viva, $ = fin de fila, ! = fin).
  L.rle = function (s) {
    const celdas = [];
    let x = 0, y = 0, num = '';
    for (const ch of s) {
      if (ch >= '0' && ch <= '9') { num += ch; continue; }
      const k = num ? parseInt(num, 10) : 1;
      num = '';
      if (ch === 'b') x += k;
      else if (ch === 'o') { for (let i = 0; i < k; i++) celdas.push([x + i, y]); x += k; }
      else if (ch === '$') { y += k; x = 0; }
      else if (ch === '!') break;
    }
    return celdas;
  };

  /* ---------- Redes en cuadrícula (Coordinación y Dilema) ---------- */
  const V4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const V8 = V4.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);

  L.vecinos = function (i, j, n, moore) {
    const out = [];
    for (const [di, dj] of (moore ? V8 : V4)) {
      const a = i + di, b = j + dj;
      if (a >= 0 && a < n && b >= 0 && b < n) out.push(a * n + b);
    }
    return out;
  };

  // Coordinación: cada casilla adopta el color de la mayoría de sus 4 vecinos; con empate se queda.
  L.coordPaso = function (col, terco, n) {
    const nuevo = col.slice();
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const k = i * n + j;
        if (terco && terco[k]) continue;
        const vs = L.vecinos(i, j, n, false);
        let unos = 0;
        for (const v of vs) unos += col[v];
        if (2 * unos > vs.length) nuevo[k] = 1;
        else if (2 * unos < vs.length) nuevo[k] = 0;
      }
    }
    return nuevo;
  };

  L.coordParejas = function (col, n) {
    let iguales = 0, total = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const k = i * n + j;
        if (j + 1 < n) { total++; if (col[k] === col[k + 1]) iguales++; }
        if (i + 1 < n) { total++; if (col[k] === col[k + n]) iguales++; }
      }
    }
    return { iguales, total };
  };

  // Dilema del Prisionero. Estrategia: 1 = coopera, 0 = traiciona.
  L.pago = function (yo, otro, p) {
    if (yo && otro) return p.R;
    if (yo && !otro) return p.S;
    if (!yo && otro) return p.T;
    return p.P;
  };

  // Coordinación: 1 punto si los dos eligen lo mismo.
  L.pagoCoord = function (yo, otro) {
    return yo === otro ? 1 : 0;
  };

  // Puntos de cada casilla jugando con sus vecinos (o con desconocidos al azar si op.mezclar).
  L.juegoPuntos = function (s, n, op) {
    const f = op.pagoFn || ((a, b) => L.pago(a, b, op.pagos));
    const pts = new Float64Array(n * n);
    const socios = new Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const k = i * n + j;
        let vs;
        if (op.mezclar) {
          const m = L.vecinos(i, j, n, op.moore).length;
          vs = [];
          const r = op.rnd || Math.random;
          while (vs.length < m && n * n > 1) {
            const x = Math.floor(r() * n * n);
            if (x !== k) vs.push(x);
          }
        } else {
          vs = L.vecinos(i, j, n, op.moore);
        }
        socios[k] = vs;
        let t = 0;
        for (const v of vs) t += f(s[k], s[v]);
        if (op.propio) t += f(s[k], s[k]);
        pts[k] = t;
      }
    }
    return { pts, socios, f };
  };
  L.dilemaPuntos = L.juegoPuntos;

  // Una ronda. Dos dinámicas:
  //  'nowak' (imitar): copia la estrategia del vecino con más puntos, si supera los propios.
  //  'nash' (mejor respuesta): elige la estrategia que le daría más puntos si sus vecinos no cambiaran.
  // Con empate, cada uno se queda con lo que tenía. Las casillas tercas nunca cambian.
  L.juegoPaso = function (s, n, op) {
    const { pts, socios, f } = L.juegoPuntos(s, n, op);
    const nuevo = new Uint8Array(n * n);
    const nash = op.dinamica === 'nash';
    for (let k = 0; k < n * n; k++) {
      if (op.terco && op.terco[k]) { nuevo[k] = s[k]; continue; }
      if (nash) {
        let p0 = 0, p1 = 0;
        for (const v of socios[k]) { p0 += f(0, s[v]); p1 += f(1, s[v]); }
        if (op.propio) { p0 += f(0, 0); p1 += f(1, 1); }
        nuevo[k] = p1 > p0 + 1e-9 ? 1 : p0 > p1 + 1e-9 ? 0 : s[k];
      } else {
        let mejor = pts[k], est = s[k];
        for (const v of socios[k]) {
          if (pts[v] > mejor + 1e-9) { mejor = pts[v]; est = s[v]; }
        }
        nuevo[k] = est;
      }
    }
    return { nuevo, pts };
  };
  L.dilemaPaso = L.juegoPaso;

  L.escenario = function (nombre, n, rnd) {
    const s = new Uint8Array(n * n);
    const c = Math.floor(n / 2);
    const r = rnd || Math.random;
    if (nombre === 'A' || nombre === 'caleidoscopio') {
      s.fill(1);
      s[c * n + c] = 0;
    } else if (nombre === 'B') {
      const lado = n === 5 ? 3 : Math.max(3, Math.round(n / 3));
      const ini = Math.floor((n - lado) / 2);
      for (let i = ini; i < ini + lado; i++) for (let j = ini; j < ini + lado; j++) s[i * n + j] = 1;
    } else if (nombre === 'C') {
      const corte = Math.ceil(n / 2) + (n === 5 ? 0 : 0);
      for (let i = 0; i < n; i++) for (let j = 0; j < corte; j++) s[i * n + j] = 1;
    } else {
      for (let k = 0; k < n * n; k++) s[k] = r() < 0.5 ? 1 : 0;
    }
    return s;
  };

  L.contar = function (s) {
    let t = 0;
    for (let k = 0; k < s.length; k++) t += s[k];
    return t;
  };

  g.CMLogica = L;
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
