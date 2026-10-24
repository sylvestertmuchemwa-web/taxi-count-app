/* Small, dependency-free QR encoder for short Taxi Count demo identifiers.
   Version 1-L supports up to 17 UTF-8 bytes. */
(function (root) {
  function multiply(a, b) {
    let value = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) value ^= a;
      const high = a & 0x80;
      a = (a << 1) & 0xff;
      if (high) a ^= 0x1d;
      b >>>= 1;
    }
    return value;
  }
  function makeGenerator(degree) {
    let poly = [1];
    let root = 1;
    for (let i = 0; i < degree; i++) {
      const next = Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= multiply(poly[j], root);
      }
      poly = next;
      root = multiply(root, 2);
    }
    return poly;
  }
  function makeCodewords(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    if (bytes.length > 17) throw new Error('Taxi Count demo QR payload must be 17 UTF-8 bytes or fewer.');
    const bits = [];
    const push = (value, count) => { for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
    push(4, 4); // byte mode
    push(bytes.length, 8);
    bytes.forEach(byte => push(byte, 8));
    for (let i = 0; i < 4 && bits.length < 152; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((n, bit) => (n << 1) | bit, 0));
    for (let pad = 0; data.length < 19; pad++) data.push(pad % 2 ? 0x11 : 0xec);
    const remainder = [...data, ...Array(7).fill(0)];
    const generator = makeGenerator(7);
    for (let i = 0; i < data.length; i++) {
      const factor = remainder[i];
      if (factor) for (let j = 0; j < generator.length; j++) remainder[i + j] ^= multiply(generator[j], factor);
    }
    return [...data, ...remainder.slice(data.length)];
  }
  function makeMatrix(text) {
    const size = 21;
    const matrix = Array.from({ length: size }, () => Array(size).fill(null));
    const finder = (top, left) => {
      for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) {
        const y = top + dy, x = left + dx;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        if (dx < 0 || dx > 6 || dy < 0 || dy > 6) matrix[y][x] = false;
        else { const edge = Math.max(Math.abs(dx - 3), Math.abs(dy - 3)); matrix[y][x] = edge === 3 || edge <= 1; }
      }
    };
    finder(0, 0); finder(0, 14); finder(14, 0);
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }
    const formatLocations = [];
    for (let i = 0; i <= 5; i++) formatLocations.push([i, 8]);
    formatLocations.push([7, 8], [8, 8], [8, 7]);
    for (let i = 9; i < 15; i++) formatLocations.push([8, 14 - i]);
    for (let i = 0; i < 15; i++) { const [y, x] = formatLocations[i]; matrix[y][x] = false; }
    for (let i = 0; i <= 7; i++) matrix[8][size - 1 - i] = false;
    for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = false;
    matrix[size - 8][8] = true;

    const bits = makeCodewords(text).flatMap(byte => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));
    let bit = 0, upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right--;
      for (let step = 0; step < size; step++) {
        const y = upward ? size - 1 - step : step;
        for (let offset = 0; offset < 2; offset++) {
          const x = right - offset;
          if (matrix[y][x] !== null) continue;
          let value = bits[bit++] || 0;
          if ((y + x) % 2 === 0) value ^= 1; // mask 0
          matrix[y][x] = value === 1;
        }
      }
      upward = !upward;
    }
    // Error correction level L, mask pattern 0.
    const formatData = 0b01000;
    let rem = formatData << 10;
    for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
    const format = ((formatData << 10) | rem) ^ 0x5412;
    formatLocations.forEach(([y, x], i) => { matrix[y][x] = ((format >>> i) & 1) === 1; });
    for (let i = 0; i <= 7; i++) matrix[8][size - 1 - i] = ((format >>> i) & 1) === 1;
    for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = ((format >>> i) & 1) === 1;
    matrix[size - 8][8] = true;
    return matrix;
  }
  function makeSvg(text, moduleSize = 8) {
    const matrix = makeMatrix(text), quiet = 4, full = matrix.length + quiet * 2;
    let path = '';
    matrix.forEach((row, y) => row.forEach((dark, x) => { if (dark) path += `M${x + quiet} ${y + quiet}h1v1h-1z`; }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" width="${full * moduleSize}" height="${full * moduleSize}" shape-rendering="crispEdges" role="img" aria-label="QR code for ${text}"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#132b20"/></svg>`;
  }
  root.makeTCQrSvg = makeSvg;
  if (typeof module !== 'undefined' && module.exports) module.exports = { makeSvg };
})(typeof window !== 'undefined' ? window : globalThis);
