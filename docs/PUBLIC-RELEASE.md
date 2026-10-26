# Persiapan publik Saku 1.2.5

Saku oleh Velora Studio Dev ditujukan untuk orang yang ingin mencatat pengeluaran dan merencanakan tabungan tanpa akun atau koneksi internet. Rilis 1.2.5 merupakan langkah penguatan sebelum peluncuran; repositori tetap privat sampai pemilik memutuskan publikasi.

## Mengapa Google meminta pemeriksaan?

Menurut [dokumentasi resmi Play Protect](https://support.google.com/accounts/answer/2812853?hl=id), APK dari luar Google Play yang belum pernah dipindai dapat diminta untuk diperiksa. Permintaan pemindaian bukan hal yang sama dengan hasil deteksi berbahaya. Jika Google secara eksplisit memblokir APK sebagai berbahaya, catat pesan dan versi yang tepat lalu ikuti jalur banding resmi; jangan mengabaikannya atau menjanjikan bahwa hasilnya pasti keliru.

Menghapus izin internet, mengenkripsi data, mengganti deskripsi, atau menandatangani APK sendiri tidak menjamin peringatan hilang. Jangan meminta calon pengguna mematikan Play Protect. Pengguna dapat mengikuti pemeriksaan resmi yang ditawarkan Google dan memasang hanya dari sumber yang dipercaya.

## Jalur distribusi

1. **Google Play:** pemilik menyiapkan dan memverifikasi akun Play Console, mengisi identitas developer serta informasi privasi/Data safety sesuai implementasi, mengatur Play App Signing, dan mengikuti persyaratan pengujian/review yang berlaku pada akunnya. AAB bertanda tangan disediakan untuk persiapan unggah; ini belum berarti aplikasi sudah diajukan atau disetujui Google.
2. **Unduhan APK:** gunakan sumber resmi dan identitas Velora Studio Dev yang konsisten, sediakan kebijakan privasi, versi, catatan perubahan, checksum APK, dan kanal bantuan. Untuk pembaruan pemasangan lama, gunakan sertifikat aplikasi yang sama.

[Program verifikasi developer Android](https://developer.android.com/developer-verification?hl=id) juga berlaku bagi distribusi di luar Google Play melalui Android Developer Console. Per 30 September 2026, perlindungan tahap awal mencakup toko yang berpartisipasi di Indonesia, Brasil, Singapura, dan Thailand; cakupannya akan berkembang. Verifikasi identitas dan pendaftaran paket adalah proses akun pemilik, terpisah dari pemindaian Play Protect. Persyaratan terkini perlu diikuti pada konsol resmi.

Saat mengaktifkan Play App Signing, rencanakan penggunaan kunci aplikasi Saku yang sudah ada jika pengguna APK GitHub harus menerima pembaruan dari Play tanpa uninstall. Menggunakan sertifikat aplikasi yang berbeda memutus kompatibilitas pembaruan tersebut. Simpan kunci/cadangan penandatanganan secara privat; jangan unggah ke repositori.

## Yang sudah disiapkan di 1.2.5

- Deskripsi repositori dan README untuk calon pengguna; kebijakan privasi dan keamanan.
- Android tanpa izin jaringan, penyimpanan terenkripsi, migrasi dari catatan lama, dan pembatasan FileProvider/WebView.
- Copyright Velora Studio Dev di bagian bawah halaman aplikasi.
- APK untuk pembaruan langsung dan AAB untuk persiapan Google Play, dengan ID `com.velorastudio.saku`, versionCode `3`, serta kunci rilis sebelumnya.

Build TypeScript/Vite dan Gradle APK/AAB berhasil. Pemeriksaan statis APK memastikan izin `INTERNET`/`ACCESS_NETWORK_STATE` tidak ada; izin signature internal AndroidX tetap ada untuk receiver privat. Tanda tangan APK/AAB valid secara kriptografis dan sertifikat APK cocok dengan 1.2.0. Sertifikat Android yang ditandatangani sendiri bukan pengesahan oleh Google. Tidak ada aplikasi yang dijalankan atau screenshot yang diambil pada tahap ini.

Belum dilakukan: publikasi repositori, pendaftaran/verifikasi developer, pengajuan atau review Google Play/Play Protect, audit independen, serta pengujian langsung atau screenshot. Klaim publik harus mengikuti kondisi tersebut. Tidak ada jaminan keamanan absolut atau jaminan lolos review Google.

## Status 1.5.0

Repositori Saku publik atas permintaan pemilik. Tahap 1.3–1.5 digabung menjadi rilis 1.5.0, versionCode 5: kategori custom, jadwal, Undo, cadangan berpassword, multi-dompet, anggaran kategori, widget Android, kunci aplikasi, Boleh Jajan, dan insight offline. Logo baru berasal dari gambar pemilik. Proyek iOS tersedia, tetapi bukan IPA siap pasang dan belum dikonfirmasi melalui Xcode/iPhone. Ketentuan Google/Apple serta batas pemeriksaan di atas tetap berlaku; lihat [catatan 1.5](RELEASE-1.5.md).

## Status 1.5.5

Pembaruan tampilan putih–hijau, lima menu yang lebih jelas, dan formulir bertahap. Paket dan penandatanganan tetap sama, versionCode 6. Tidak ada perubahan skema keuangan atau layanan online. Lihat [catatan 1.5.5](RELEASE-1.5.5.md) untuk rincian dan batas pemeriksaan.
