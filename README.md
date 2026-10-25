# Saku

<img src="public/saku-logo.png" alt="Logo Saku" width="96" height="96" />

**Catatan keuangan pribadi yang cepat, privat, dan sepenuhnya offline.**

Saku membantu Anda mengetahui uang yang masih bisa dipakai, mengurangi pengeluaran, dan menabung untuk keinginan. Pisahkan tunai, rekening, serta e-wallet; catat uang masuk dan keluar; lalu lihat anggaran dan saran berdasarkan catatan Anda. Dibuat oleh **Velora Studio Dev**, tanpa login, iklan, backend, atau AI online.

**[Unduh APK Saku 1.5.0](https://github.com/velorastudiodev-cpu/saku-android/releases/download/v1.5.0/Saku-1.5.0.apk)** · [Semua berkas rilis](https://github.com/velorastudiodev-cpu/saku-android/releases/tag/v1.5.0) · [Privasi](PRIVACY.md) · [Keamanan](SECURITY.md)

Android **7.0+** dengan Android System WebView yang diperbarui. Bahasa Indonesia, rupiah utuh. Repositori dan APK publik; belum diterbitkan di Google Play. **Proyek iOS 15.4+ tersedia, tetapi belum dikompilasi dengan Xcode atau dikonfirmasi di iPhone. Belum ada IPA/TestFlight.** [Status iOS](docs/IOS.md).

## Yang baru di 1.5

Pembaruan ini menggabungkan tahap 1.3–1.5: pengalaman harian, pengelolaan uang, dan insight offline.

| Kebutuhan | Fitur dan lokasi |
| --- | --- |
| Memisahkan uang tunai, bank, e-wallet | **Transaksi → Dompet & transfer**. Saldo per dompet, pemindahan uang tanpa menambah pemasukan/pengeluaran, serta riwayat transfer. |
| Mengingat uang jajan atau tagihan | **Transaksi → Transaksi berulang**. Jadwal mingguan/bulanan, konfirmasi atau otomatis saat aplikasi dibuka, pengingat lokal opsional. |
| Membatasi belanja | Anggaran bulanan keseluruhan serta **Pengaturan → Anggaran kategori**. Peringatan dalam aplikasi pada 80% dan 100%. |
| Memutuskan belanja hari ini | **Ringkasan → Boleh Jajan?**. Simulasi nominal dan kategori, memperhitungkan saldo, tujuan tabungan, pengeluaran hari ini, dan kebutuhan terjadwal. |
| Memahami pola pengeluaran | **Saku Insight**: perbandingan tujuh hari, kategori Lainnya yang dominan, perkiraan akhir bulan, dan peluang penghematan. Semua dihitung lokal. |
| Mencatat dan memperbaiki kesalahan | Tambah/edit/hapus transaksi, pencarian, filter bulan/jenis/dompet, kategori custom, ubah kategori massal, serta **Urungkan** selama 10 detik. |
| Melihat angka yang mudah dipahami | Ringkasan lebih singkat; laporan minggu/bulan dengan arus kas bersih dalam rupiah. Persentase tersedia sebagai rincian dengan dasar perhitungan. |
| Menabung untuk tujuan | Nominal dan tenggat tujuan, alokasi/penarikan tabungan, progres, dan estimasi tabungan harian. |
| Menjaga privasi tanpa akun | **Pengaturan → Privasi & akses cepat**: kunci aplikasi opsional memakai biometrik atau PIN/pola/sandi layar perangkat. |
| Mencatat dari layar utama | **Widget Android** untuk saldo tersedia, sisa anggaran, dan tombol Catat. Nominal disembunyikan secara default; tampilan angka perlu diaktifkan sendiri. |
| Memindahkan data | Cadangan JSON berpassword, impor tervalidasi dengan konfirmasi, CSV transaksi untuk spreadsheet. |

Logo memakai gambar dari pemilik yang telah dipisahkan dari latar. Tampilan tetap netral, dengan transisi tab, angka, grafik, tanda berhasil, dan progres tujuan yang halus serta menghormati preferensi pengurangan gerak. Geser kiri/kanan halaman atau navbar untuk berpindah menu; scroll vertikal untuk membaca.

## Memasang atau memperbarui

1. Unduh `Saku-1.5.0.apk` dari tautan resmi di atas. AAB adalah berkas distribusi untuk Play Console, bukan berkas instalasi langsung.
2. **Jika sudah memakai Saku, ekspor cadangan terlebih dahulu.** Pasang pembaruan di atas aplikasi lama; jangan uninstall atau hapus data. ID paket dan sertifikat tetap sama.
3. Android dapat meminta izin memasang aplikasi dari browser/pengelola file. Jika Play Protect meminta pemeriksaan, ikuti proses resmi Google.
4. Data lama otomatis masuk ke **Dompet utama**, dengan saldo dan riwayat tetap. Tambahkan dompet lain dan gunakan transfer untuk membagi uang yang sudah tercatat.

Skema cadangan terbaru adalah **v3** dan memerlukan Saku 1.5 atau lebih baru. Cadangan lama skema v1/v2 tetap dapat diimpor. Jangan downgrade setelah migrasi. Pembaruan ini belum diuji langsung pada perangkat; simpan cadangan lama secara terpisah.

Kode atau tanda tangan tidak menjamin peringatan Play Protect hilang. Verifikasi developer dan review toko aplikasi merupakan proses pemilik akun melalui konsol resmi. [Panduan distribusi](docs/PUBLIC-RELEASE.md).

## Jadwal, widget, dan kunci aplikasi

**Jadwal:** mode konfirmasi menunggu tombol Catat. Mode otomatis memproses kejadian saat aplikasi dibuka/aktif, bukan ketika aplikasi sudah ditutup. Maksimal 100 kejadian per batch; cursor dan transaksi disimpan bersama untuk mencegah duplikasi. Jadwal akhir bulan mempertahankan tanggal asal. Jadwal hanya mencatat uang, tidak memindahkan dana bank.

**Pengingat:** setelah izin diberikan, kejadian berikutnya dijadwalkan pukul 09.00 waktu perangkat. Notifikasi tidak memuat nominal atau catatan. Buka Saku untuk memperbarui pengingat berikutnya; OS dapat menundanya karena baterai/fokus. Tidak meminta izin alarm presisi.

**Widget:** tekan lama layar utama Android → Widget → Saku. Saldo dan anggaran diperbarui ketika Saku dibuka atau data disimpan, dengan tanggal pembaruan terlihat. Widget tidak menjalankan transaksi berulang. Pada pergantian bulan, buka Saku untuk memperbarui anggaran. Jika kunci aplikasi aktif, angka widget disembunyikan dan izinnya direset. Widget tersedia untuk Android; tidak ada widget iOS pada versi ini.

**Kunci:** memakai autentikasi perangkat, bukan PIN baru yang disimpan Saku. Android 7–9 memakai kunci layar; Android 10+ memakai dialog biometrik/kredensial sistem yang tersedia. Perubahan pengaturan juga meminta autentikasi. Saat aktif, akses berkas native diperiksa, tampilan dilindungi ketika aplikasi tidak aktif, dan screenshot Android dibatasi. Implementasi iOS memakai LocalAuthentication; belum diverifikasi dengan Xcode/perangkat.

**Urungkan:** mengembalikan perubahan terakhir yang mendukung Undo selama 10 detik, sebelum perubahan berikutnya atau aplikasi ditutup/dikunci. Pemulihan cadangan, pengaturan privasi, dan pencatatan otomatis tidak memakai Undo.

## Cara angka dihitung

| Angka | Dasar perhitungan |
| --- | --- |
| Saldo dompet | Saldo awal dompet + pemasukan − pengeluaran + transfer masuk − transfer keluar |
| Saldo total | Jumlah saldo seluruh dompet; transfer internal saling meniadakan |
| Saldo tersedia | Saldo total − seluruh alokasi tujuan |
| Arus kas bersih periode | Pemasukan − pengeluaran pada minggu/bulan tersebut; saldo awal dan transfer bukan pemasukan |
| Sisa anggaran | Batas bulanan − pengeluaran bulan tersebut |
| Kebutuhan terjadwal | Pengeluaran berulang aktif yang belum dicatat hingga akhir bulan, termasuk yang lewat jatuh tempo |
| Perkiraan akhir bulan | Pengeluaran tercatat + rata-rata harian sejak catatan pengeluaran pertama bulan ini × hari mendatang; tampil setelah rentang catatan minimal tujuh hari |

**Boleh Jajan?** mengambil nilai terendah dari saldo tersedia dan sisa anggaran (jika diatur), lalu mengurangi kebutuhan terjadwal. Dana ini minimal nol. Ruang hari ini = nilai terkecil dana tersebut dan `floor((dana + pengeluaran hari ini) / sisa hari termasuk hari ini) − pengeluaran hari ini`, minimal nol. Memilih kategori juga membatasi simulasi pada sisa anggaran kategori. Pemasukan yang belum diterima tidak dihitung.

Contoh: dana Rp210.000 untuk enam hari menghasilkan Rp35.000 hari ini. Setelah belanja Rp25.000, ruang tersisa Rp10.000. Ini contoh perhitungan, bukan data pengguna. Kebutuhan wajib harus dimasukkan sebagai jadwal; catatan yang tidak lengkap memengaruhi hasil. Saran dan perkiraan bukan jaminan finansial.

Alokasi tujuan tidak memindahkan uang nyata atau mengubah saldo total. Saat membeli barang tujuan, kembalikan alokasinya lalu catat pengeluaran. Menghapus tujuan melepas alokasi. Saldo minus tetap ditampilkan. Dompet yang masih dipakai tidak dapat dihapus; transfer yang salah dapat dihapus dan dicatat ulang.

## Privasi dan cadangan

Tidak ada server, login, analitik, iklan, atau pengunggahan otomatis. APK tidak memiliki izin internet. Catatan Android dienkripsi AES-256-GCM dengan Android Keystore; proyek iOS memakai CryptoKit/Keychain. Browser pengembangan memakai penyimpanan browser, dengan perlindungan berbeda dari aplikasi native.

**JSON baru dienkripsi dengan kata sandi; CSV dan JSON lama tidak dienkripsi.** Tidak ada pemulihan kata sandi melalui server. Cadangkan secara berkala, terutama sebelum mengganti HP, uninstall, atau menghapus data. Backup/transfer otomatis Android dinonaktifkan. Widget yang diizinkan menampilkan angka menyimpan dua nominal ringkasan pada penyimpanan privatnya; rincian dan pilihan ada di [kebijakan privasi](PRIVACY.md).

## Mengembangkan dan membangun

React + TypeScript + Vite + Capacitor. Node.js 22+, JDK 21, Android SDK platform 36/build-tools 36.0.0.

```bash
npm ci
npm run dev
npm run build
npm test
```

```bash
export ANDROID_HOME=/lokasi/android-sdk
export JAVA_HOME=/lokasi/jdk-21
export SAKU_KEYSTORE=/lokasi/privat/saku-release.jks
export SAKU_STORE_PASSWORD_FILE=/lokasi/privat/release-password.txt
bash scripts/build-android.sh
```

ID paket `com.velorastudio.saku`, versionCode **5**, versionName **1.5.0**. APK/AAB bertanda tangan dan SHA-256 masuk `artifacts/`; kunci tidak masuk repo. [Panduan iOS](docs/IOS.md).

Batas data: 30 dompet, 20.000 transaksi, 20.000 transfer, 100 tujuan, 50 jadwal, 50 kategori custom per jenis; nominal serta jumlah saldo awal maksimal Rp1 triliun. Impor plaintext maksimal 10 MB, berkas terenkripsi maksimal 16 MB; penyimpanan native membatasi plaintext 10 MB. Skema divalidasi sebelum penulisan.

Ponytail dan Taste Skill digunakan; arah visual **Achromatic ledger**, seed `1792834316`. Pemeriksaan logika penting dan build Android dijalankan. Tidak ada screenshot atau pengujian UI/perangkat langsung; detail ada di [catatan rilis 1.5](docs/RELEASE-1.5.md). Fixture pengembangan bukan data bawaan pengguna.

## Bantuan

Gunakan Issues untuk bug/saran; sertakan versi Saku, OS, dan langkah kejadian. Jangan mengunggah cadangan, kredensial, atau transaksi pribadi ke laporan publik. Laporan kerentanan mengikuti [SECURITY.md](SECURITY.md).

Copyright © 2026 by **Velora Studio Dev**.
