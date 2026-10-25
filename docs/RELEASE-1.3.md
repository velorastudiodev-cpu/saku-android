> Catatan tahap pengerjaan 1.3, bukan rilis publik terpisah. Instruksi terbaru pemilik memperluas pekerjaan sampai 1.5 dan menyediakan logo. Lihat [rilis gabungan 1.5](RELEASE-1.5.md) untuk status akhir.

# Catatan teknis Saku 1.3.0

## Cakupan

Sesuai pilihan pemilik: hanya roadmap 1.3 dahulu, ditambah persiapan iOS dan cadangan berpassword. Multi-dompet, widget, anggaran kategori, dan app lock tetap 1.4. Boleh Jajan? serta Insight 2.0 tetap 1.5. Foto logo baru tidak terlampir; logo saat ini dipertahankan.

## Data dan perilaku

Skema 1 dibaca dan dinormalisasi menjadi skema 2 tanpa mengubah nominal. Skema 2 menambah kategori custom, jadwal, serta preferensi pengingat. Pemulihan mengenali JSON lama dan envelope cadangan berpassword; hasil dekripsi divalidasi sebelum konfirmasi penggantian. Jangan downgrade setelah memakai skema baru.

Jadwal menggunakan tanggal lokal, frekuensi mingguan/bulanan, tanggal jangkar bulanan, mode konfirmasi/otomatis, dan status aktif. ID kejadian deterministik mencegah transaksi ganda pada pemrosesan ulang. Tanggal 31 bergeser ke akhir bulan pendek lalu kembali ke 31 pada bulan berikutnya. Penulisan otomatis hanya saat aplikasi terbuka/aktif; notifikasi sistem bukan mesin pencatatan latar belakang. Rekurensi yang terlewat tetap menunggu, dengan batas pemrosesan dan jumlah transaksi. Undo mengembalikan snapshot terakhir selama 10 detik, dibatalkan oleh perubahan data berikutnya.

Cadangan baru menggunakan AES-256-GCM, IV/salt acak, PBKDF2-SHA256 310.000 iterasi, kata sandi minimal 10 karakter, serta batas ukuran/parameter sebelum derivasi kunci. Kata sandi tidak disimpan. CSV dan JSON lama tidak mendapat enkripsi baru secara otomatis.

## Pemeriksaan

- TypeScript strict dan build Vite produksi berhasil.
- 17 unit test lulus (11 pemeriksaan dasar yang diperbarui untuk skema v2, 6 untuk migrasi, kategori custom, kalender bulanan/mingguan, idempotensi/konfirmasi, serta cadangan berpassword yang salah atau diubah).
- Taste source lint: 0 FAIL, 3 WARN. Zero-padding diperlukan untuk tanggal ISO; bayangan hanya pada overlay dialog dan toast yang memang diizinkan oleh panduan app-screen. Gaya Achromatic ledger/seed 1792834316 dipertahankan tanpa redraw.
- Tes browser menyeluruh, screenshot aplikasi, emulator, dan perangkat fisik tidak dijalankan sesuai preferensi pemilik. Generasi aset iOS merasterisasi SVG logo lama, bukan screenshot aplikasi.
- Proyek iOS ditambahkan dan disinkronkan, tetapi belum dikompilasi atau ditandatangani dengan Xcode. Dukungan iPhone masih perlu dikonfirmasi; tidak ada IPA yang diserahkan.

Build bukan jaminan tidak ada bug. Khususnya izin/pengiriman pengingat, keyboard, akses file, dan penyimpanan native perlu validasi perangkat sebelum klaim dukungan publik yang lebih luas.
