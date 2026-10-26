# Kebijakan privasi Saku

Versi 1.5.7 · Pengembang: **Velora Studio Dev**.

Saku membantu Anda mencatat pemasukan, pengeluaran, anggaran, kategori, jadwal berulang, dan tujuan tabungan tanpa akun. Semua catatan dimasukkan oleh Anda; Saku tidak membaca bank, SMS, kontak, lokasi, kamera, atau transaksi dari aplikasi lain. Proyek iOS sedang dipersiapkan dan belum diverifikasi melalui build/perangkat Apple.

## Penyimpanan dan koneksi

Nama panggilan, saldo awal per dompet, transfer internal, anggaran bulanan/kategori, transaksi, kategori buatan sendiri, jadwal, pilihan pengingat, serta tujuan tabungan disimpan pada perangkat. Tidak ada server Saku, iklan, analitik, pelacakan, layanan AI online, atau laporan kerusakan yang dikirim otomatis. Font dan saran sistem tersedia lokal. APK Android tidak memiliki izin internet. Implementasi iOS menggunakan aset lokal dan pembatasan koneksi WebView; iOS tidak memiliki model izin INTERNET seperti Android.

Catatan Android dienkripsi dengan AES-256-GCM menggunakan kunci Android Keystore. Implementasi iOS memakai AES-GCM melalui CryptoKit dan kunci Keychain yang tidak disinkronkan ke iCloud serta hanya berlaku pada perangkat itu. Kunci native tidak disertakan dalam cadangan portabel. Data versi lama dinormalisasi ke skema baru tanpa mengubah nominal. Kegagalan membaca data menampilkan pemulihan, bukan menghapus catatan secara otomatis.

Kunci aplikasi opsional memakai autentikasi biometrik atau PIN/pola/sandi layar perangkat. Saku tidak menerima atau menyimpan PIN/templat biometrik. Pengaturan mengaktifkan/menonaktifkan kunci juga meminta verifikasi. Saat aktif, aplikasi mengunci kembali ketika tidak aktif; akses baca/tulis native diperiksa, dan data tidak ditampilkan sebelum verifikasi. Android membatasi screenshot dengan FLAG_SECURE. iOS menutupi tampilan ketika tidak aktif, tetapi tidak menjanjikan pemblokiran screenshot saat aplikasi terbuka. Implementasi iOS belum diverifikasi pada perangkat Apple.

Perangkat root/kompromi atau akses saat aplikasi sudah terbuka berada di luar perlindungan ini. Tidak ada klaim keamanan mutlak atau audit independen. Browser pengembangan memakai penyimpanan browser tanpa enkripsi Keystore/Keychain atau kunci native.

## Widget dan insight

Widget Android menyembunyikan nominal secara default. Jika Anda mengaktifkan tampilannya, saldo tersedia, sisa anggaran, dan tanggal pembaruan disimpan tanpa enkripsi ledger di SharedPreferences privat widget dan ditampilkan di layar utama. Tidak ada nama dompet, riwayat, atau catatan transaksi di widget. Mengaktifkan kunci aplikasi menghapus ringkasan widget dan mencabut pilihan menampilkan angka. Widget tidak tersedia untuk iOS pada rilis ini.

Boleh Jajan dan Saku Insight memakai aturan/perhitungan lokal. Tidak ada data yang dikirim ke model AI. Kebutuhan terjadwal, perbandingan kategori, dan prediksi hanya berdasarkan catatan Anda; hasilnya tidak disimpan sebagai transaksi dan tidak menjamin hasil keuangan.

## Transaksi berulang dan pengingat

Mode konfirmasi menunggu persetujuan Anda untuk setiap tanggal. Mode otomatis mencatat kejadian yang jatuh tempo saat aplikasi dibuka atau aktif. Tidak ada penarikan rekening; ini hanya catatan keuangan lokal. Jadwal tetap menunggu jika aplikasi ditutup.

Pengingat lokal bersifat opsional dan meminta izin notifikasi setelah Anda memilih mengaktifkannya. Notifikasi memakai teks umum tanpa nominal, nama kategori, atau catatan transaksi. Sistem perangkat menyimpan jadwal/tanggal pengingat. Saku tidak memakai push server. Sistem dapat menunda notifikasi karena pengaturan baterai atau fokus. Buka aplikasi untuk memperbarui pengingat berikutnya.

Tanda panduan sudah dibaca serta pilihan aktif/jam pengingat harian disimpan dalam preferensi lokal perangkat, terpisah dari catatan keuangan terenkripsi. Nilai ini tidak memuat nominal atau transaksi dan tidak ikut cadangan JSON. Menghapus data aplikasi mengembalikan panduan awal dan pilihan pengingat. Pengingat harian memiliki satu jadwal berulang; pengingat transaksi rutin diatur secara terpisah.

Ilustrasi panduan disertakan di dalam aplikasi. Pembuatannya menggunakan alat gambar saat pengembangan; aplikasi tidak mengirim data pengguna ke alat tersebut atau membutuhkan koneksi untuk menampilkan gambar.

## Cadangan dan berbagi

Ekspor hanya dilakukan atas pilihan Anda. **Cadangan JSON baru dienkripsi dengan kata sandi pilihan Anda** menggunakan AES-256-GCM, salt/IV acak, serta PBKDF2-SHA256. Kata sandi tidak disimpan dan tidak dapat direset melalui server. Simpan kata sandi secara terpisah. Cadangan ini dapat dipindahkan antarperangkat tanpa kunci perangkat asal.

**CSV dan cadangan JSON lama tidak dienkripsi.** Jangan membagikannya kepada pihak yang tidak dipercaya. Lembar berbagi Android/iOS menyerahkan berkas hanya kepada aplikasi yang Anda pilih; aplikasi penerima dapat memiliki koneksi internet dan kebijakan privasi sendiri.

Salinan ekspor sementara berada di direktori cache khusus. Aplikasi mencoba membersihkan salinan lebih dari 24 jam saat dibuka kembali; Android/iOS dapat membersihkan cache lebih cepat. Salinan yang sudah Anda simpan atau kirim berada di luar kendali Saku.

Impor membaca file pilihan Anda, memeriksa format/ukuran, membuka cadangan berpassword jika diperlukan, lalu memvalidasi isinya. Catatan hanya diganti setelah konfirmasi. Jadwal otomatis yang sudah lewat dapat diproses setelah pemulihan. Cadangan skema v3 memerlukan Saku 1.5 atau lebih baru; file lama skema v1/v2 tetap dapat diimpor. Pilihan kunci aplikasi dan tampilan widget berlaku pada perangkat dan tidak ikut cadangan portabel.

## Penghapusan dan batas pemulihan

Transaksi/tujuan/jadwal dapat dihapus dari aplikasi. Hapus data aplikasi atau uninstall menghilangkan catatan lokal; Saku tidak memiliki salinan server. Ekspor cadangan sebelum mengganti HP. Backup/transfer otomatis data Android dinonaktifkan; direktori catatan iOS dikecualikan dari backup. Kunci native tidak portabel. Hapus salinan ekspor secara terpisah dari lokasi penyimpanannya.

## Kontak dan sumber resmi

APK dan sumber aplikasi tersedia pada [repositori resmi Saku](https://github.com/velorastudiodev-cpu/saku-android). Proses Play Protect/App Store berasal dari platform, bukan server Saku. Untuk bantuan gunakan Issues repositori; jangan mengunggah cadangan, kata sandi, token, atau catatan keuangan ke laporan publik. Laporan kerentanan mengikuti [SECURITY.md](SECURITY.md).

Copyright © 2026 by Velora Studio Dev.
