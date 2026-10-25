# Keamanan Saku

## Cakupan versi 1.5.0

Versi ini memakai skema data 3, autentikasi perangkat opsional, widget privat secara default, cadangan portabel berpassword, serta implementasi iOS yang belum dikompilasi/diuji dengan Xcode. Build dan pemeriksaan statis artefak tidak menggantikan audit keamanan atau pengujian perangkat. Versi ini belum mendapat audit independen atau pengujian langsung migrasi/penyimpanan pada perangkat fisik.

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

Kunci aplikasi opsional memakai BiometricPrompt/kredensial perangkat Android dan LocalAuthentication pada sumber iOS. Saku tidak membuat PIN sendiri atau menyimpan biometrik. Sesi native dimulai terkunci jika fitur aktif; akses ledger diperiksa, tampilan ditutup saat tidak aktif, dan pembukaan tampilan menunggu status React siap. Ini kontrol akses aplikasi; kunci enkripsi ledger tidak diikat ke autentikasi per operasi Keystore. Keystore tidak berarti semua perangkat mempunyai perlindungan perangkat keras yang sama. Enkripsi tidak menjamin keamanan pada perangkat root/kompromi atau terhadap orang yang menggunakan aplikasi saat perangkat terbuka. Cadangan JSON baru dienkripsi dengan kata sandi; CSV dan JSON lama tidak dienkripsi. Kata sandi yang hilang tidak bisa dipulihkan. Kunci yang hilang tidak bisa dipulihkan dari server; simpan cadangan secara pribadi.

SHA-256 mengonfirmasi kesesuaian unduhan dengan berkas pada rilis, bukan sertifikasi keamanan. Keputusan Play Protect dan verifikasi identitas developer merupakan proses Google yang terpisah dari build aplikasi.

## Melaporkan kerentanan

Jangan sertakan token, kunci, cadangan, atau catatan keuangan dalam Issues publik. Jika **Security → Report a vulnerability** tersedia pada repositori, gunakan jalur privat tersebut. Jika belum tersedia, kirim permintaan kanal privat kepada pengelola melalui Issues tanpa menyebut detail eksploitasi atau data sensitif. Belum ada SLA atau program bug bounty yang dijanjikan.

## Sebelum distribusi publik

Pengujian di perangkat untuk migrasi dari 1.2.x, pembukaan ulang setelah proses dihentikan, impor/ekspor, dan perilaku tanpa koneksi masih perlu dilakukan. Pengujian langsung dan screenshot sengaja tidak dijalankan pada pembaruan ini sesuai permintaan pemilik. Lihat [panduan peluncuran](docs/PUBLIC-RELEASE.md) untuk proses distribusi dan Play Protect.

## Tambahan sampai 1.5

- Kata sandi cadangan diproses dengan PBKDF2-SHA256 310.000 iterasi, salt 16 byte acak, AES-256-GCM dengan IV 12 byte acak dan tag autentikasi. Parameter format/ukuran dibatasi sebelum derivasi kunci. Minimum kata sandi 10 karakter; tidak disimpan oleh Saku.
- Cadangan skema v1/v2 dapat dimigrasikan ke v3; format yang tidak dikenal ditolak. Kategori dan jadwal divalidasi sebelum disimpan. ID kejadian deterministik dan penulisan cursor bersama transaksi mencegah duplikasi jadwal.
- APK menambah izin notifikasi (opsional), wake lock, dan penerimaan boot untuk pengingat lokal. Izin internet tetap dihapus; izin alarm presisi sengaja dihapus dan notifikasi dijadwalkan inexact. Payload pengingat tidak memuat catatan/nominal.
- iOS memakai kode CryptoKit AES-GCM, Keychain `WhenUnlockedThisDeviceOnly`, file protection complete, atomic write, dan pengecualian backup. Implementasi ini belum dibangun atau diperiksa pada perangkat Apple; lihat [status iOS](docs/IOS.md).
- 22 tes logika lulus; bukan audit keamanan atau validasi native. Tes UI/perangkat dan screenshot tidak dijalankan pada rilis ini. [Catatan pemeriksaan](docs/RELEASE-1.5.md).

- Widget memakai PendingIntent immutable ke MainActivity. Tindakan Catat hanya membuka form, tidak membuat transaksi. Dua nominal ringkasan disimpan dalam preferensi privat hanya setelah persetujuan; kunci aplikasi menghapusnya, dan receiver memeriksa status kunci sebelum menampilkan angka.
- Izin USE_BIOMETRIC ditambahkan untuk autentikasi sistem. PIN/pola/sandi diverifikasi OS beserta pembatasan percobaannya, bukan JavaScript. FLAG_SECURE aktif selama kunci aplikasi diaktifkan. Pemilik yang mematikan kunci layar perangkat perlu mengatur kunci layar kembali untuk memverifikasi Saku.
- Saldo awal gabungan harus sama dengan jumlah saldo awal dompet. Referensi dompet, ID transfer, kategori anggaran, tanggal, dan nominal diperiksa pada impor/penyimpanan. Transfer tersimpan terpisah dari transaksi income/expense.
