# Keamanan Saku

## Cakupan versi 1.2.5

Versi ini menambah penguatan untuk persiapan distribusi publik. Build dan pemeriksaan statis artefak tidak menggantikan audit keamanan atau pengujian perangkat. Versi ini belum mendapat audit independen atau pengujian langsung migrasi/penyimpanan pada perangkat fisik.

| Area | Perlindungan |
| --- | --- |
| Koneksi aplikasi | Izin `INTERNET` dan `ACCESS_NETWORK_STATE` dihapus dari manifest gabungan; WebView menolak pemuatan jaringan. Tidak ada akun, backend, telemetri, atau iklan. |
| Catatan Android | AES-256-GCM dengan IV acak setiap penyimpanan, tag autentikasi 128 bit, dan kunci Android Keystore. Berkas disimpan di direktori privat `noBackupFilesDir`. |
| Ketahanan penyimpanan | AtomicFile, sinkronisasi berkas, dan pembacaan hasil tulis sebelum konfirmasi. Data versi lama dibersihkan setelah salinan terenkripsi bisa dibaca. Kegagalan dekripsi tidak dianggap sebagai akun kosong. |
| Cadangan otomatis | Backup dan transfer Android dinonaktifkan; cadangan pengguna melalui ekspor JSON tetap tersedia. |
| Berbagi berkas | FileProvider tidak diekspor; hanya direktori cache `exports/` dapat dibagikan dengan izin baca sementara. Tidak ada pemetaan seluruh penyimpanan eksternal. |
| WebView | Debugging dan log Capacitor dimatikan; akses URL file, geolokasi, pop-up otomatis, mixed content, dan jaringan dibatasi. |
| Konten produksi | CSP membatasi sumber skrip/aset pada aplikasi, koneksi pada origin lokal, serta menolak objek, frame, worker, dan pengiriman form native. Inline style tetap diperlukan untuk grafik/progres. Bootstrap Capacitor tepercaya disisipkan sebelum meta CSP oleh runtime. |
| Masukan | JSON impor divalidasi, nilai uang dibatasi, teks ditampilkan melalui React, dan formula CSV dinetralkan. |
| Distribusi | ID paket dan sertifikat tanda tangan dipertahankan untuk pembaruan. SHA-256 APK tersedia pada setiap rilis. Kunci tanda tangan tidak masuk repositori. |

## Batas perlindungan

APK menggunakan kunci layar dan keamanan Android untuk kontrol akses. Tidak ada kunci aplikasi terpisah. Keystore tidak berarti semua perangkat mempunyai perlindungan perangkat keras yang sama. Enkripsi tidak menjamin keamanan pada perangkat root/kompromi atau terhadap orang yang menggunakan aplikasi saat perangkat terbuka. JSON/CSV hasil ekspor tidak dienkripsi. Kunci yang hilang tidak bisa dipulihkan dari server; simpan cadangan secara pribadi.

SHA-256 mengonfirmasi kesesuaian unduhan dengan berkas pada rilis, bukan sertifikasi keamanan. Keputusan Play Protect dan verifikasi identitas developer merupakan proses Google yang terpisah dari build aplikasi.

## Melaporkan kerentanan

Jangan sertakan token, kunci, cadangan, atau catatan keuangan dalam Issues publik. Jika **Security → Report a vulnerability** tersedia pada repositori, gunakan jalur privat tersebut. Jika belum tersedia, kirim permintaan kanal privat kepada pengelola melalui Issues tanpa menyebut detail eksploitasi atau data sensitif. Belum ada SLA atau program bug bounty yang dijanjikan.

## Sebelum distribusi publik

Pengujian di perangkat untuk migrasi dari 1.2.0, pembukaan ulang setelah proses dihentikan, impor/ekspor, dan perilaku tanpa koneksi masih perlu dilakukan. Pengujian langsung dan screenshot sengaja tidak dijalankan pada pembaruan ini sesuai permintaan pemilik. Lihat [panduan peluncuran](docs/PUBLIC-RELEASE.md) untuk proses distribusi dan Play Protect.
