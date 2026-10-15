// Dijalankan setelah `npx cap add android`: tanda tangan tetap, ikon, nomor versi.
const fs = require('fs'), path = require('path');
const sharp = require('sharp');

(async () => {
  const app = 'android/app', res = path.join(app, 'src/main/res');
  const run = process.env.GITHUB_RUN_NUMBER || '1';

  // 1. Keystore tetap (debug) agar APK baru bisa menimpa versi lama tanpa hapus data
  const { execFileSync } = require('child_process');
  const ks = 'flashcard-debug.keystore';
  const keytool = (...a) => execFileSync('keytool', a, { stdio: 'pipe' });
  fs.writeFileSync(ks, Buffer.from(fs.readFileSync(ks + '.b64', 'utf8').trim(), 'base64'));
  try { keytool('-list', '-keystore', ks, '-storepass', 'flashcard26'); }
  catch (e) { // berkas .b64 rusak: buat keystore baru supaya build tetap jalan (APK lama tidak bisa ditimpa)
    console.warn('PERINGATAN: ' + ks + '.b64 tidak valid, membuat keystore baru.');
    fs.rmSync(ks, { force: true });
    keytool('-genkeypair', '-keystore', ks, '-alias', 'flashcard', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
      '-storepass', 'flashcard26', '-keypass', 'flashcard26', '-dname', 'CN=Flashcard Arab, O=sherlocomp, C=ID');
  }

  // 2. Gradle: tanda tangan + versi
  const gp = path.join(app, 'build.gradle');
  let g = fs.readFileSync(gp, 'utf8');
  if (!g.includes('flashcard-debug.keystore')) {
    g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        debug {
            storeFile file("../../flashcard-debug.keystore")
            storePassword "flashcard26"
            keyAlias "flashcard"
            keyPassword "flashcard26"
        }
    }`);
  }
  g = g.replace(/versionCode\s+\d+/, `versionCode ${run}`)
       .replace(/versionName\s+"[^"]*"/, `versionName "1.0.${run}"`);
  fs.writeFileSync(gp, g);

  // 3. Ikon launcher dari icon.svg
  const icon = fs.readFileSync('icon.svg');
  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, s] of Object.entries(sizes)) {
    const dir = path.join(res, 'mipmap-' + d);
    if (!fs.existsSync(dir)) continue;
    const png = await sharp(icon, { density: 384 }).resize(s, s).png().toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), png);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), png);
    fs.rmSync(path.join(dir, 'ic_launcher_foreground.png'), { force: true });
  }

  // 4. Ikon adaptif (Android 8+): latar teal + kartu (grup #mark di icon.svg) di zona aman 66/108
  const mark = fs.readFileSync('icon.svg', 'utf8').match(/<g id="mark">[\s\S]*<\/g>/)[0];
  const fg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><g transform="translate(27 27) scale(0.1289)">${mark}</g></svg>`;
  fs.mkdirSync(path.join(res, 'drawable-nodpi'), { recursive: true });
  fs.writeFileSync(path.join(res, 'drawable-nodpi/ic_launcher_fg.png'),
    await sharp(Buffer.from(fg), { density: 384 }).resize(432, 432).png().toBuffer());
  fs.mkdirSync(path.join(res, 'values'), { recursive: true });
  fs.writeFileSync(path.join(res, 'values/ic_launcher_background.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F766E</color>
</resources>
`);
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_fg"/>
</adaptive-icon>
`;
  const any = path.join(res, 'mipmap-anydpi-v26');
  fs.mkdirSync(any, { recursive: true });
  fs.writeFileSync(path.join(any, 'ic_launcher.xml'), adaptive);
  fs.writeFileSync(path.join(any, 'ic_launcher_round.xml'), adaptive);
  fs.rmSync(path.join(res, 'drawable-v24/ic_launcher_foreground.xml'), { force: true });
  fs.rmSync(path.join(res, 'drawable/ic_launcher_background.xml'), { force: true });

  console.log('Android siap: tanda tangan, ikon, versi 1.0.' + run);
})().catch(e => { console.error(e); process.exit(1); });
