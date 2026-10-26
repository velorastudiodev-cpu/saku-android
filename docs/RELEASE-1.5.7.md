# Saku 1.5.7 — perkenalan singkat dan pengingat harian

Menambahkan panduan awal dan pengingat opsional pada tampilan 1.5.5. Paket tetap `com.velorastudio.saku`, versionCode 7, dengan sertifikat rilis yang sama. Tidak ada migrasi data keuangan baru.

## Panduan awal

Tiga halaman mengenalkan pencatatan uang, tabungan/anggaran, dan privasi offline. Ilustrasi dompet, tabungan, serta buku catatan memakai hijau–cream dengan tekstur lembut dan latar transparan. Gambar tersimpan di paket aplikasi, tanpa pengambilan gambar dari internet saat digunakan.

Panduan mendukung geser, Lanjut, Kembali, pemilih halaman, dan Lewati panduan. Halaman terakhir berakhir dengan Mulai pakai Saku; pengguna baru melanjutkan ke pengisian nama/saldo awal, sedangkan pengguna lama masuk ke catatannya. Status selesai disimpan per perangkat agar panduan tidak berulang setiap membuka aplikasi. Membaca ulang tersedia di **Lainnya → Tentang Saku → Lihat panduan Saku**. Ukuran layar yang berubah diselaraskan dengan halaman aktif; reduced motion menonaktifkan scroll halus.

## Pengingat yang bisa dipilih

- Tidak aktif secara default. Pengguna memilihnya di akhir panduan atau di **Lainnya → Pengingat**. Jam awal yang ditawarkan adalah 20.00, dan bisa diubah.
- Izin sistem diminta setelah pengguna memilih mengaktifkan. Penolakan izin tidak menghalangi pemakaian Saku.
- Satu ID/jadwal kalender lokal harian, terpisah dari ID pengingat transaksi rutin. Mengganti jam mengganti jadwal yang sama; mematikan pengingat membatalkan jadwal dan membersihkan notifikasi hariannya yang sudah tampil.
- Judul: **Saku**. Isi: **Ada transaksi hari ini? Luangkan sebentar untuk melengkapi catatanmu.** Tanpa emoji, nominal, nama, kategori, atau catatan pribadi. Ketuk untuk membuka form transaksi.
- Pengingat tetap mengajak memeriksa kelengkapan walau ada transaksi pada hari itu. Pengingat tagihan/rutin yang sebelumnya diaktifkan tetap memiliki pengaturannya sendiri di Rencana → Jadwal.
- Android 8+ memakai saluran berprioritas rendah dengan getaran dimatikan dan suara senyap; Android 7 memakai berkas suara senyap. Ikon notifikasi berupa siluet dompet. Implementasi iOS memakai notifikasi passive tanpa suara; belum dikonfirmasi di perangkat Apple.
- Tidak memakai server push, koneksi internet, alarm presisi, atau bangun paksa saat perangkat tidur. Sistem dapat menunda/membatasi notifikasi sesuai baterai, fokus, force-stop, atau izin. Buka kembali Saku setelah mengganti zona waktu atau izin agar jadwal diselaraskan.

Pilihan jam/status harian dan tanda panduan selesai merupakan preferensi lokal, terpisah dari ledger terenkripsi dan cadangan JSON. Alur penyimpanan berusaha mengembalikan jadwal sebelumnya jika pembaruan gagal. Pengingat bukan transaksi otomatis dan tidak mengubah saldo.

## Pemeriksaan dan batas

- TypeScript dan build produksi Vite berhasil; aset disinkronkan ke proyek Android/iOS.
- Dua pemeriksaan logika terarah lulus: preferensi kosong/rusak tidak mengaktifkan notifikasi, validasi batas jam, ID tetap terpisah dari jadwal rutin, dan payload kalender harian tanpa rincian uang/emoji atau alarm presisi.
- Source lint Taste: 0 FAIL, 4 WARN yang tetap berkaitan dengan format tanggal, overlay, dan penanda nilai laporan kosong.
- Build release APK/AAB, tanda tangan, sertifikat pembaruan, versi, izin manifest, serta kesamaan aset dalam paket diperiksa sebelum publikasi.
- Referensi pengujian UI lama disesuaikan agar panduan awal tidak menghalangi skenario yang sudah ada; skenario UI tersebut tidak dijalankan.

Tidak ada screenshot aplikasi, uji browser UI, emulator, atau perangkat fisik. Ilustrasi hasil generator ditinjau sebagai aset; ini bukan validasi tampilan aplikasi. Pengiriman notifikasi aktual saat perangkat tidur/reboot, izin native, gestur, serta pembaruan aplikasi terpasang masih perlu konfirmasi di perangkat. iOS tetap proyek sumber tanpa build Xcode/IPA/TestFlight.

## Ponytail dan Taste

Ponytail mempertahankan plugin Capacitor yang sudah terpasang dan satu ID harian, tanpa layanan atau dependensi baru. Taste memakai arah **Pastel consumer**, seed `1928218152`, melanjutkan desain 1.5.5 yang disetujui pemilik. Warna cream `#fff8ed` dibatasi pada panduan; layar keuangan tetap putih–hijau. Tiga ilustrasi dibuat melalui alat image generation untuk tugas ini. Tidak ada data contoh dalam rilis atau skor inspeksi visual yang diklaim.

Simpan cadangan sebelum memasang APK di atas versi lama; jangan uninstall untuk memperbarui.
