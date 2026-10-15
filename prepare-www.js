// Menyusun folder www/ (dipakai Pages dan APK): berkas aplikasi + pustaka dan font lokal dari node_modules.
// Jalankan setelah `npm install`. Pustaka PDF wajib ada; font opsional (tanpa font, huruf Arab memakai font bawaan perangkat).
const fs = require('fs'), path = require('path');
const APP = ['index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon.svg', 'sw.js'];
const LIBS = [['html2canvas/dist/html2canvas.min.js', 'html2canvas.min.js'], ['jspdf/dist/jspdf.umd.min.js', 'jspdf.umd.min.js']];
const FONTS = [['amiri', [400, 700]], ['noto-naskh-arabic', [400, 700]], ['noto-kufi-arabic', [700]],
               ['scheherazade-new', [700]], ['lateef', [700]], ['nunito', [600, 800]]];

fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www/vendor/fonts', { recursive: true });

for (const f of APP) {
  if (!fs.existsSync(f)) { console.error('Berkas tidak ditemukan: ' + f); process.exit(1); }
  fs.copyFileSync(f, path.join('www', f));
}
for (const [from, to] of LIBS) {
  const p = path.join('node_modules', from);
  if (!fs.existsSync(p)) { console.error('Pustaka tidak ditemukan: ' + p + ' (jalankan npm install)'); process.exit(1); }
  fs.copyFileSync(p, path.join('www/vendor', to));
}

let css = '', nFont = 0;
for (const [pkg, weights] of FONTS) {
  for (const w of weights) {
    const cssFile = path.join('node_modules/@fontsource', pkg, w + '.css');
    if (!fs.existsSync(cssFile)) { console.warn('PERINGATAN: font dilewati, tidak ada ' + cssFile); continue; }
    let c = fs.readFileSync(cssFile, 'utf8');
    c = c.replace(/,\s*url\(\.\/files\/[^)]+\.woff\)\s*format\(['"]woff['"]\)/g, ''); // cukup woff2
    for (const m of c.matchAll(/url\(\.\/files\/([^)]+\.woff2)\)/g)) {
      const src = path.join('node_modules/@fontsource', pkg, 'files', m[1]);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join('www/vendor/fonts', m[1]));
      else console.warn('PERINGATAN: berkas font tidak ada: ' + src);
    }
    css += c.replace(/url\(\.\/files\//g, 'url(') + '\n';
    nFont++;
  }
}
fs.writeFileSync('www/vendor/fonts/fonts.css', css);
console.log('www/ siap: ' + APP.length + ' berkas aplikasi, ' + LIBS.length + ' pustaka, ' + nFont + '/' +
  FONTS.reduce((a, f) => a + f[1].length, 0) + ' gaya font');
