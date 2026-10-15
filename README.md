# Arabic Flashcard Maker A4

Pembuat **flashcard kosakata Arab–Indonesia** siap cetak di kertas A4: sisi depan dan belakang sejajar, garis potong, 90 template, lembar latihan, dan mode belajar.
Berjalan di browser tanpa server dan tanpa akun. Data tersimpan di perangkatmu.

## Fitur

- Tempel data dari Google Sheets/Excel (pemisah TAB, `|`, `=`, `:`) atau impor CSV.
- 4/6/8/9 kartu per A4, portrait/landscape, preset per jenjang kelas.
- Koreksi cetak dupleks manual: geser dan skala sisi belakang, halaman **Tes duplex**, cetak "Depan saja" / "Belakang saja".
- Transliterasi otomatis (teks Arab berharakat), gambar per kartu atau emoji otomatis.
- Ekspor PDF/PNG, lembar latihan (menjodohkan, isian, pilihan ganda) dengan kunci jawaban, mode belajar dengan suara.
- Simpan/buka proyek (JSON), mode gelap.

## Cara memakai

- **Web (GitHub Pages):** `https://sherlocomp-cyber.github.io/Flashcard-maker/`
- **Android:** unduh APK terbaru di halaman **Releases**, lalu pasang (izinkan pemasangan dari sumber lain). APK tidak memperbarui diri; pasang APK terbaru untuk memperbarui.

Di aplikasi Android, **Export PDF** membuka lembar Bagikan (simpan ke File/Drive, kirim, atau cetak). Tombol **Print** di Android membuat PDF yang sama; cetak dari PDF tersebut.

## Rilis

Setiap push ke `main` (selain perubahan `.md`) menjalankan workflow **Rilis (APK + Pages)**, bisa juga manual lewat **Actions → Rilis → Run workflow**:

1. Job `pages` membangun folder `www/` dan men-deploy ke GitHub Pages.
2. Job `apk` membangun APK debug (Capacitor) dan melampirkannya ke rilis `v1.0.<nomor run>`.

**Pengaturan sekali di awal:** `Settings → Pages → Build and deployment → Source: GitHub Actions`.

APK ditandatangani dengan keystore debug tetap di repo (`flashcard-debug.keystore.b64`) supaya versi baru bisa menimpa versi lama tanpa menghapus data. Ini bukan kunci rilis Play Store.

## Struktur repo

| Berkas | Fungsi |
| --- | --- |
| `index.html` | Kerangka halaman |
| `styles.css` | Gaya antarmuka dan 90 template kartu |
| `app.js` | Seluruh logika aplikasi |
| `manifest.webmanifest`, `icon.svg` | Metadata PWA dan ikon |
| `sw.js` | Service worker untuk mode offline (web) |
| `prepare-www.js` | Menyusun `www/`: berkas aplikasi + html2canvas, jsPDF, dan font dari `node_modules` |
| `prepare-android.js` | Tanda tangan, ikon, dan versi untuk APK |
| `capacitor.config.json`, `package.json` | Konfigurasi Capacitor dan dependensi |
| `.github/workflows/release.yml` | Workflow rilis |

## Pengembangan

```
npm install
npm run build          # membuat www/
python3 -m http.server -d www
```

`index.html` memuat pustaka dan font dari `vendor/`, yang baru ada setelah `npm run build`. Buka `www/`, bukan `index.html` di root. Kalau menambah berkas web baru, daftarkan di `prepare-www.js` (`APP`) dan `ASSETS` di `sw.js`. Naikkan `CACHE` di `sw.js` setiap rilis.

## Data dan privasi

Semua data (kartu, gambar, pengaturan) disimpan di `localStorage` perangkat. Tidak ada pelacakan dan tidak ada permintaan jaringan ke pihak lain. Gambar yang banyak bisa memenuhi penyimpanan otomatis, jadi simpan proyek ke JSON secara berkala (**Simpan Proyek**).
