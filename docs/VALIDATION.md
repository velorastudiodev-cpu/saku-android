# Validasi Saku 1.0.0

Tanggal: 24 Oktober 2026.

## Pemeriksaan fungsi

- TypeScript strict dan build Vite produksi: lulus.
- 11 unit test: uang integer, saldo/alokasi/surplus, pemasukan nol, batas nominal, tanggal, minggu lintas tahun, Februari kabisat, agregasi grafik/kategori, tujuan kedaluwarsa, cadangan rusak, duplikasi ID, integer overflow, dan CSV formula injection.
- 9 tes Playwright: onboarding, tambah/edit/hapus transaksi, pemasukan, perpindahan periode, tujuan dan alokasi, dana tidak cukup, filter, ekspor CSV/JSON, import valid/rusak, pemulihan penyimpanan rusak, pengaturan persisten, ukuran 360/390/768/1440, dan aksesibilitas.
- Axe WCAG 2 A/AA dan 2.1 AA pada lima layar serta dialog transaksi: tidak ada pelanggaran yang terdeteksi.
- Audit dependensi produksi npm: 0 kerentanan yang dilaporkan saat pemeriksaan.

## Pemeriksaan desain

Ponytail full + Taste Skill app run. Gaya **Achromatic ledger**, seed **1792834316**, tanpa redraw. Font Geist dimuat dari bundel lokal; latar biru abu berasal dari dunia buku kas. Elemen khas Saku adalah pecahan saldo tersedia/tujuan dan ruang jajan harian.

Taste inspector pada Ringkasan, Laporan, dan Tujuan, masing-masing pada 1440, 768, dan 390 piksel: **0 FAIL, 0 WARN** pada hasil akhir. Source lint: 0 FAIL, 1 WARN yang dijelaskan oleh zero-padding bulan/tanggal ISO, bukan penomoran dekoratif. Semua screenshot akhir ketiga viewport dilihat; transaksi, pengaturan, dan dialog diperiksa juga pada screenshot ponsel.

Catatan kritik akhir berdasarkan tujuh pertanyaan app-screen:

1. Saldo tersedia menjadi angka terbesar pada Ringkasan, surplus pada Laporan, dan uang terkumpul pada Tujuan. Aksi pencatatan satu ketukan dari halaman utama.
2. Tepi panel dan jarak antarkolom konsisten. Ruang kosong berlebih pada tujuan ringkasan diisi estimasi harian yang berguna; penjelasan laporan kini menyebut dasar pembagian persentase.
3. Chrome netral, satu biru pada data utama, status hijau/merah hanya pada perubahan bermakna. Logo saku konsisten dengan ikon aplikasi.
4. Fixture: Rp350.000 saldo awal + Rp1.950.000 pemasukan − Rp468.000 pengeluaran = Rp1.832.000 saldo; alokasi Rp850.000 menyisakan Rp982.000 tersedia. Surplus Rp1.482.000 = 76% dari pemasukan.
5. Akun awal kosong tanpa angka fiktif. Nol tampil nol; rasio tanpa pemasukan tampil “—”. Kesalahan penyimpanan dan validasi terlihat.
6. Biru dan abu pada legenda sama dengan batang; sumbu rupiah memiliki skala. Grafik harian punya tabel nominal yang dapat dibuka untuk angka kecil atau pembaca layar.
7. Navigasi berubah menjadi lima tujuan di bawah layar ponsel. Form memakai dialog dengan fokus terperangkap, label, dan target sentuh. Keterangan sekunder 11–12px tetap menjadi batas keterbacaan pada layar sangat kecil.

Data contoh berada di `tests/fixture.ts` dan screenshot dokumentasi: profil Dira, sembilan transaksi, Dana darurat, Headphone baru. Data ini tidak dibundel di APK. Tidak ada foto stok atau gambar pengganti; ikon garis dan logo vektor adalah UI aplikasi.

## Android

- ID aplikasi `com.velorastudio.saku`, versionCode 1, versionName 1.0.0.
- Minimum API 24 (Android 7), target/compile API 36.
- Build Gradle release dan lint release: berhasil, tanpa error. Peringatan yang tersisa berasal dari pembaruan versi dependensi yang tersedia, sumber bawaan Capacitor yang tidak direferensikan secara statis, serta lint konfigurasi backup/ikon untuk variasi API. Backup dinonaktifkan dan ikon monokrom disediakan pada API 33+.
- APK disejajarkan dengan zipalign, ditandatangani kunci RSA 4096, dan diverifikasi apksigner menggunakan skema v2/v3.
- Identitas paket, versi, minimum SDK, dan izin diperiksa dengan aapt. Tidak meminta izin penyimpanan luas, kontak, lokasi, atau kamera.
- APK diperiksa untuk memastikan token GitHub yang diberikan dan fixture contoh tidak masuk bundel.

## Batas pemeriksaan

Belum diuji di perangkat Android fisik atau emulator. Lembar berbagi/pemilih file Android, keyboard vendor, area status bar perangkat, dan perilaku tombol kembali native perlu diperiksa pada HP tujuan. Tes browser menguji implementasi web dan penyimpanan fallback; bukan pengganti pengujian hardware.

Data lokal ikut terhapus jika aplikasi di-uninstall atau data aplikasi dibersihkan. Cadangkan melalui JSON. Cadangan JSON tidak dienkripsi, dan belum ada PIN/biometrik dalam aplikasi. Simpan kunci penandatanganan secara privat untuk pembaruan tanpa uninstall.
