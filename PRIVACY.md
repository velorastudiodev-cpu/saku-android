# Kebijakan privasi Saku

Versi aplikasi: 1.2.5. Pengembang: **Velora Studio Dev**.

Saku membantu Anda mencatat pemasukan, pengeluaran, anggaran, dan tujuan tabungan tanpa membuat akun. Semua catatan dimasukkan oleh Anda; Saku tidak mengakses rekening bank, SMS, kontak, lokasi, kamera, atau daftar transaksi dari aplikasi lain.

## Data yang tersimpan

Nama panggilan, saldo awal, anggaran, transaksi beserta tanggal/kategori/catatan, dan tujuan tabungan disimpan pada perangkat Anda. APK Android tidak memiliki izin internet. Tidak ada server Saku, iklan, analitik, pelacak, atau pengiriman laporan kerusakan otomatis. Font dan saran sistem tersedia lokal; saran tidak dikirim ke layanan AI.

Pada Android, catatan dienkripsi dengan AES-256-GCM menggunakan kunci yang dibuat dalam Android Keystore. Kunci tidak disertakan dalam APK atau cadangan. Data lama dari versi sebelumnya dipindahkan ke penyimpanan terenkripsi; salinan lama dibersihkan setelah salinan terenkripsi berhasil disimpan dan dibaca kembali. Jika catatan gagal dibaca, aplikasi menampilkan pemulihan alih-alih menghapusnya secara otomatis.

Enkripsi melindungi berkas yang disimpan, bukan akses seseorang ke aplikasi yang sudah terbuka. Gunakan kunci layar perangkat. Saku belum memiliki PIN/biometrik aplikasi terpisah. Perangkat yang di-root, sistem yang disusupi, dan akses fisik ke perangkat yang terbuka berada di luar perlindungan ini. Tidak ada klaim keamanan mutlak atau audit independen.

## Ekspor, impor, dan berbagi

Ekspor JSON/CSV hanya berjalan ketika Anda memilihnya. **Berkas ekspor tidak dienkripsi** dan memuat catatan keuangan. Simpan di lokasi pribadi. Lembar berbagi Android mengizinkan Anda memilih aplikasi penerima; aplikasi tersebut dapat memiliki koneksi internet dan kebijakan privasinya sendiri. Pilihan penerima merupakan keputusan Anda, bukan unggahan otomatis oleh Saku.

Salinan ekspor sementara berada dalam direktori cache khusus. Aplikasi mencoba membersihkan salinan yang lebih dari 24 jam saat dibuka kembali; cache dapat dihapus lebih cepat oleh Android. Salinan yang sudah Anda simpan atau kirim berada di luar kendali Saku.

Impor JSON membaca file yang Anda pilih, memvalidasi isinya, lalu meminta konfirmasi sebelum mengganti catatan saat ini. Saku tidak meminta izin untuk membaca seluruh penyimpanan perangkat.

## Retensi dan penghapusan

Anda dapat menghapus transaksi dan tujuan dari aplikasi. Menghapus data aplikasi melalui Pengaturan Android atau melakukan uninstall akan menghapus catatan lokal; kunci enkripsi dapat ikut hilang. Saku tidak dapat mengambil ulang catatan dari server. Ekspor cadangan sebelum mengganti perangkat atau menghapus aplikasi. Cadangan cloud dan transfer data otomatis Android dinonaktifkan untuk data aplikasi. Hapus salinan ekspor secara terpisah dari tempat Anda menyimpannya.

Pratinjau pengembangan di browser menggunakan penyimpanan browser dan tidak memiliki enkripsi Android Keystore. Pernyataan enkripsi di atas berlaku untuk APK Android resmi.

## Sumber pemasangan dan pertanyaan

Gunakan tautan rilis pada [repositori resmi Saku](https://github.com/velorastudiodev-cpu/saku-android). Saat tahap persiapan publik, repositori dan APK masih memerlukan akses GitHub. Pemeriksaan Play Protect dilakukan oleh Google/Android, bukan oleh server Saku.

Informasi pengembang tersedia di [profil Velora Studio Dev](https://github.com/velorastudiodev-cpu). Untuk masalah aplikasi, gunakan Issues pada repositori apabila akses tersedia. Jangan unggah cadangan keuangan, token, atau data pribadi ke laporan publik. Cara melaporkan kerentanan tercantum pada [kebijakan keamanan](SECURITY.md).

Copyright © 2026 by Velora Studio Dev.
