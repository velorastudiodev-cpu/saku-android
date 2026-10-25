# Saku 1.5.0 — catatan rilis dan batas pemeriksaan

Instruksi terakhir pemilik menggabungkan pengerjaan 1.3–1.5 dan memberikan gambar logo. Tahap 1.3 tidak diterbitkan sebagai rilis terpisah. Rilis ini melanjutkan 1.2.5, memakai paket `com.velorastudio.saku`, versionCode 5, dan kunci penandatanganan yang sama.

## Perubahan

- Ringkasan dipadatkan; arus kas bersih memakai rupiah, persentase rinci dengan penjelasan saldo awal. Tab/swipe, angka saldo, grafik, tanda berhasil, dan progres tujuan memakai animasi ringan dengan reduced-motion fallback.
- Kategori custom, perubahan kategori massal mengikuti filter, serta Urungkan 10 detik setelah perubahan manual yang didukung.
- Jadwal transaksi mingguan/bulanan: konfirmasi atau otomatis saat aplikasi aktif, cursor atomik bersama transaksi, ID deterministik, penanganan akhir bulan. Pengingat lokal opsional tanpa alarm presisi dan tanpa nominal pada notifikasi.
- Multi-dompet dengan saldo awal per dompet, pilihan dompet pada transaksi/jadwal, filter dompet, transfer internal terpisah dari arus kas, riwayat transfer, dan perlindungan penghapusan dompet yang masih dipakai.
- Anggaran bulanan per kategori, peringatan dalam aplikasi pada 80%/100%, dan penjelasan ketika total batas kategori melebihi anggaran keseluruhan.
- Boleh Jajan memperhitungkan alokasi tujuan, pengeluaran hari ini, kebutuhan berulang belum dicatat hingga akhir bulan, batas kategori, dan sisa hari. Tidak mengasumsikan pemasukan mendatang sudah diterima.
- Insight membandingkan dua rentang tujuh hari, menyoroti Lainnya yang dominan, memproyeksikan akhir bulan setelah minimal tujuh hari rentang catatan, dan memberi contoh penghematan berdasarkan kategori terbesar.
- Widget Android: saldo tersedia, sisa anggaran, tanggal pembaruan, dan pintasan Catat. Nominal default tersembunyi, opt-in terpisah, serta dihapus/disembunyikan ketika kunci aplikasi diaktifkan. Pintasan membuka form tanpa membuat transaksi otomatis.
- Kunci opsional memakai autentikasi perangkat. Status sesi diperiksa pada akses ledger native; tampilan ditutup saat tidak aktif dan baru dibuka setelah UI kunci siap. Android memakai FLAG_SECURE, BiometricPrompt atau kunci layar sistem. iOS memakai LocalAuthentication pada sumber proyek.
- JSON cadangan berpassword (AES-256-GCM/PBKDF2-SHA256), impor dengan validasi dan konfirmasi, kompatibilitas skema lama. CSV tetap plaintext dan menyertakan nama dompet; transfer tidak dicampur ke CSV pemasukan/pengeluaran, tetapi masuk cadangan JSON.
- Logo pemilik dipisahkan dari latar lalu dipakai di UI, favicon, launcher/splash Android, dan ikon/splash iOS. Hijau tetap pada identitas logo, tampilan aplikasi netral.
- Proyek iOS 15.4+ dengan penyimpanan CryptoKit/Keychain, file protection, pengecualian backup, status bar terang dengan ikon gelap, dan manifest privasi. Belum ada build Xcode/IPA.

## Migrasi dan batas perilaku

Skema v1/v2 dimigrasikan ke v3: saldo awal, transaksi, dan jadwal ditempatkan pada Dompet utama, tanpa mengubah nominal. Transfer/anggaran kategori awal kosong. Pilihan kunci aplikasi dan widget tersimpan per perangkat, tidak dibawa dalam backup portabel. Jangan downgrade setelah migrasi. Cadangkan data sebelum memperbarui dan jangan uninstall aplikasi lama.

Jadwal otomatis diproses ketika aplikasi aktif, 100 kejadian per batch; batas penyimpanan berlaku. Pengingat hanya kejadian berikutnya dan dapat ditunda OS. Widget tidak memproses ledger saat aplikasi tertutup; tanggal pembaruan membantu mengenali ringkasan lama. Kunci memerlukan kunci layar perangkat, bukan PIN Saku terpisah. Insight berbasis catatan dan tidak memberi kepastian hasil keuangan.

## Pemeriksaan yang dilakukan

- TypeScript dan build produksi Vite berhasil; aset disinkronkan ke Android dan iOS.
- 22 pemeriksaan unit logika lulus: saldo/alokasi, tanggal/nominal, validasi impor, migrasi v1/v2, kategori, idempotensi jadwal, backup berpassword/tamper, transfer tanpa penggandaan arus kas, batas anggaran, perhitungan ruang jajan, dan insight.
- Gradle release APK/AAB berhasil, termasuk kompilasi kode Android untuk widget dan autentikasi.
- Artefak rilis ditandatangani dan diperiksa sertifikat, versi, serta izin manifest. Tidak ada izin INTERNET, ACCESS_NETWORK_STATE, atau SCHEDULE_EXACT_ALARM.
- Taste source lint: 0 FAIL, 3 WARN. Peringatan adalah padding tanggal ISO dan bayangan untuk dua overlay (dialog/toast), bukan dekorasi panel.
- XML/plist iOS dapat diparse; ini bukan kompilasi Swift atau pengujian runtime Apple.

## Yang tidak dijalankan

Tidak menjalankan UI end-to-end, emulator, perangkat fisik, atau screenshot sesuai permintaan pemilik. Belum mengonfirmasi migrasi APK terpasang, autentikasi/lock lifecycle di hardware, variasi launcher widget, notifikasi OS, dan impor/ekspor native di perangkat. Belum ada audit keamanan independen, review Google Play/Play Protect, build Xcode, penandatanganan Apple, atau IPA/TestFlight. Kompilasi dan tes logika tidak membuktikan semua perilaku perangkat.

## Arah desain dan sumber

Ponytail dipakai untuk mengikuti pola penyimpanan dan komponen yang sudah ada, serta autentikasi OS tanpa sistem login/PIN baru. Taste Skill mempertahankan **Achromatic ledger**, seed `1792834316`, Geist lokal, dasar abu-abu netral, dan satu warna utama pada grafik. Tidak mengganti arah visual. Logo berasal dari gambar pemilik, dengan pemisahan latar melalui alat pengolahan gambar. Tidak ada aset stok, data demo, atau layanan AI online dalam aplikasi rilis. Tidak ada skor inspeksi visual yang diklaim karena screenshot tidak dijalankan.
