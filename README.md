# Saku

**Catatan keuangan Android yang bisa dipakai sepenuhnya offline.**

Saku membantu Anda mengetahui ke mana uang pergi, membatasi pengeluaran, dan menyisihkan uang untuk hal yang berarti. Catat pemasukan atau pengeluaran dalam rupiah, lalu lihat saldo, pola belanja, dan kemajuan tabungan dalam satu aplikasi. Dibuat oleh **Velora Studio Dev** untuk orang yang ingin mengatur keuangan sehari-hari tanpa akun, iklan, atau pengaturan yang rumit.

**[Unduh Saku 1.2.5](https://github.com/velorastudiodev-cpu/saku-android/releases/tag/v1.2.5)** · [Privasi](PRIVACY.md) · [Keamanan](SECURITY.md)

Android **7.0+**, dengan Android System WebView yang diperbarui. Bahasa Indonesia, rupiah utuh. Saat ini dalam persiapan peluncuran publik: repositori masih privat dan unduhan memerlukan akses GitHub. Saku belum dirilis di Google Play.

## Yang bisa Anda lakukan

| Kebutuhan | Fitur Saku |
| --- | --- |
| Mengetahui uang yang masih bisa dipakai | Saldo total, saldo tersedia setelah alokasi tabungan, dan ruang jajan harian. |
| Mengurangi pengeluaran tanpa menebak | Anggaran bulanan, kategori belanja, dan Catatan Saku berisi komentar serta saran dari transaksi Anda. |
| Mencatat uang sehari-hari | Tambah, edit, hapus, cari, dan filter pemasukan/pengeluaran berdasarkan tanggal dan kategori. |
| Memahami kebiasaan | Grafik mingguan/bulanan, rincian kategori, surplus bersih, dan persentasenya. |
| Menabung untuk keinginan | Tujuan dengan nominal, tanggal target, progres, alokasi uang, dan estimasi yang perlu disisihkan per hari. |
| Menjaga dan memindahkan catatan | Ekspor JSON untuk cadangan, impor dengan konfirmasi, dan ekspor CSV untuk spreadsheet. |

Geser kiri/kanan pada halaman atau navbar untuk berpindah menu. Scroll vertikal tetap untuk membaca; form dan tabel menggunakan interaksinya sendiri. Animasi mengikuti preferensi pengurangan gerak perangkat.

Saku adalah pencatat keuangan. Aplikasi tidak mengakses bank, memindahkan uang, atau menjamin hasil tabungan. Saran dihitung di perangkat berdasarkan catatan Anda dan tidak mengubah saldo secara otomatis.

## Mulai menggunakan

1. Dari halaman rilis, buka **Assets** dan unduh `Saku-1.2.5.apk`.
2. Buka APK. Android dapat meminta izin memasang aplikasi dari browser/pengelola file tersebut; cabut kembali izin setelah pemasangan selesai.
3. Jika Play Protect menawarkan pemeriksaan, ikuti proses resmi Google. Jangan menonaktifkan perlindungannya.
4. Isi nama panggilan, saldo awal, dan anggaran bulanan opsional. Mulai catat transaksi pertama Anda.

**Pembaruan dari versi lama:** ekspor cadangan JSON terlebih dahulu, lalu pasang APK di atas aplikasi yang sudah ada. Jangan uninstall atau hapus data. Versi 1.2.5 memakai paket dan kunci tanda tangan yang sama serta memigrasikan catatan Android ke penyimpanan terenkripsi.

Permintaan pemeriksaan untuk APK yang belum dikenal dapat muncul pada pemasangan di luar Google Play; perubahan kode tidak menjamin peringatan tersebut hilang. Detail dan jalur distribusi resmi ada pada [panduan peluncuran](docs/PUBLIC-RELEASE.md) dan [bantuan Google Play Protect](https://support.google.com/accounts/answer/2812853?hl=id). Jika Google menyatakan APK berbahaya, hentikan pemasangan dan laporkan versi/pesannya kepada pengembang.

## Pembaruan 1.2.5

- APK tidak memiliki izin internet; fungsi inti tetap tersedia tanpa koneksi.
- Catatan Android dienkripsi dengan AES-256-GCM dan kunci Android Keystore. Migrasi mempertahankan salinan lama sampai data terenkripsi berhasil disimpan dan dibaca kembali.
- Berbagi berkas dibatasi pada direktori ekspor; akses WebView dan konten produksi diperketat, debugging serta log runtime dinonaktifkan.
- Penjelasan produk, privasi, keamanan, dan proses peluncuran diperjelas. Copyright Velora Studio Dev tampil di bagian bawah halaman.

Pematangan ini mengikuti Ponytail dengan menggunakan API Android yang tersedia, tanpa layanan cloud atau dependensi baru. Build produksi dilakukan; pengujian langsung, screenshot, dan rangkaian tes otomatis tidak dijalankan untuk versi ini sesuai permintaan pemilik. Hasil pengujian di [dokumen validasi lama](docs/VALIDATION.md) hanya berlaku bagi versi 1.0.0. Versi 1.2.5 belum diaudit secara independen.

## Privasi yang perlu diketahui

Tidak ada akun, backend, analitik, iklan, atau pengunggahan catatan otomatis. Data Android disimpan di ruang privat aplikasi dan dienkripsi. **Gunakan kunci layar perangkat:** Saku belum memiliki PIN/biometrik aplikasi terpisah dan tidak menjanjikan keamanan mutlak terhadap perangkat yang disusupi.

**JSON/CSV hasil ekspor tidak dienkripsi.** Simpan file tersebut secara pribadi. Membagikannya kepada aplikasi lain mengikuti pilihan Anda dan kebijakan aplikasi penerima. Salinan cache ekspor yang lebih dari 24 jam dicoba dibersihkan saat Saku dibuka kembali.

Cadangan otomatis dan transfer data Android dinonaktifkan. Uninstall, hapus data, atau kehilangan kunci dapat membuat catatan tidak dapat dipulihkan tanpa cadangan JSON. Ekspor berkala dan sebelum berpindah HP. [Baca kebijakan privasi lengkap](PRIVACY.md).

## Cara angka dihitung

| Angka | Rumus |
| --- | --- |
| Saldo total | Saldo awal + seluruh pemasukan − seluruh pengeluaran |
| Saldo tersedia | Saldo total − jumlah alokasi tujuan |
| Surplus periode | Pemasukan periode − pengeluaran periode |
| Persentase surplus | Surplus ÷ pemasukan × 100%; “—” jika pemasukan nol |
| Porsi arus uang | Masing-masing jenis ÷ (pemasukan + pengeluaran) × 100% |
| Kebutuhan tabungan harian | Pembulatan ke atas dari sisa target ÷ hari hingga tenggat, termasuk hari ini |
| Ruang jajan harian | Nilai terendah saldo tersedia dan sisa anggaran ÷ hari tersisa dalam bulan; tanpa anggaran hanya saldo tersedia |

Alokasi tujuan tidak mengubah saldo total. Menghapus tujuan melepas alokasi ke saldo tersedia. Saat membeli barang tujuan, kembalikan alokasinya lalu catat pengeluaran sebenarnya. Saldo negatif tetap terlihat. Minggu laporan dimulai Senin; perbandingan laporan memakai periode sebelumnya secara penuh.

Catatan Saku menyoroti pengeluaran yang mencapai 80% anggaran/pemasukan, pemasukan yang naik setidaknya 50% dibanding rentang hari sebanding pada bulan sebelumnya, dan peluang menabung saat surplus mencapai 30% pemasukan. Nominal saran tabungan adalah 20% dari nilai terendah surplus bulan ini dan saldo tersedia, minimal nol. Ini patokan sederhana, bukan penilaian lengkap atas kondisi keuangan Anda.

## Untuk pengembang

React + TypeScript + Vite + Capacitor. Data JSON skema v1; maksimal 20.000 transaksi, 100 tujuan, dan Rp1 triliun per nominal. Impor dibatasi 10 MB dan divalidasi sebelum konfirmasi. Browser memakai penyimpanan browser; enkripsi Android Keystore khusus APK.

```bash
npm ci
npm run dev
npm run build
```

Node.js 22+, JDK 21, Android SDK platform 36 dan build-tools 36.0.0. Build APK dan AAB:

```bash
export ANDROID_HOME=/lokasi/android-sdk
export JAVA_HOME=/lokasi/jdk-21
export SAKU_KEYSTORE=/lokasi/privat/saku-release.jks
export SAKU_STORE_PASSWORD_FILE=/lokasi/privat/release-password.txt
bash scripts/build-android.sh
```

ID paket: `com.velorastudio.saku`, versionCode `3`, versionName `1.2.5`. APK dan AAB yang ditandatangani serta SHA-256 berada dalam `artifacts/`. AAB untuk persiapan Play Console dan tidak dapat dipasang langsung seperti APK. Kunci/kata sandi penandatanganan tidak masuk repositori. Jika menggunakan Play App Signing, ikuti [panduan kontinuitas kunci](docs/PUBLIC-RELEASE.md) sebelum mengunggah ke Play.

Tes tersedia melalui `npm test` dan `npm run test:e2e`, tetapi belum dijalankan ulang pada versi 1.2.5. Catatan desain awal ada di [rencana](docs/PLAN.md). Screenshot dan fixture lama menggunakan data contoh Dira; data tersebut tidak masuk APK.

## Bantuan

Gunakan Issues repositori untuk bug dan saran apabila akses tersedia. Sertakan versi Saku, versi Android, dan langkah terjadinya masalah. Jangan mengunggah cadangan keuangan atau kredensial ke laporan publik. Kerentanan keamanan mengikuti [SECURITY.md](SECURITY.md).

Copyright © 2026 by **Velora Studio Dev**.
