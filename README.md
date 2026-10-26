# Saku

<img src="public/saku-logo.png" alt="Logo Saku" width="96" height="96" />

**Catatan keuangan pribadi yang cepat, privat, dan sepenuhnya offline.**

Saku membantu Anda mengetahui uang yang masih bisa dipakai, mengurangi pengeluaran, dan menabung untuk keinginan. Pisahkan tunai, rekening, serta e-wallet; catat uang masuk dan keluar; lalu lihat anggaran dan saran berdasarkan catatan Anda. Dibuat oleh **Velora Studio Dev**, tanpa login, iklan, backend, atau AI online.

**[Unduh APK Saku 1.5.7](https://github.com/velorastudiodev-cpu/saku-android/releases/download/v1.5.7/Saku-1.5.7.apk)** · [Semua berkas rilis](https://github.com/velorastudiodev-cpu/saku-android/releases/tag/v1.5.7) · [Privasi](PRIVACY.md) · [Keamanan](SECURITY.md)

Android **7.0+** dengan Android System WebView yang diperbarui. Bahasa Indonesia, rupiah utuh. Repositori dan APK publik; belum diterbitkan di Google Play. **Proyek iOS 15.4+ tersedia, tetapi belum dikompilasi dengan Xcode atau dikonfirmasi di iPhone. Belum ada IPA/TestFlight.** [Status iOS](docs/IOS.md).

## Yang baru di 1.5.7

- **Panduan awal tiga halaman**, bisa digeser atau memakai Lanjut/Kembali, dengan ilustrasi dompet, tabungan, dan catatan pribadi dalam hijau–cream. Tampil sekali pada perangkat, bisa dilewati, dan tersedia lagi di **Lainnya → Tentang Saku → Lihat panduan Saku**.
- **Pengingat harian opsional**, default jam pilihan 20.00. Aktifkan di akhir panduan atau **Lainnya → Pengingat**; jam bisa diubah dan pengingat bisa dimatikan. Menolak izin tetap membolehkan memakai Saku.
- Notifikasi singkat tanpa emoji, nominal, atau rincian transaksi. Ketuk untuk membuka form catatan. Pengingat dijadwalkan lokal, tanpa server atau internet.


Tampilan putih–hijau dan alur yang lebih ringkas setelah masukan pengguna. Beranda mengutamakan uang tersedia, tombol Pengeluaran/Pemasukan, serta sisa anggaran. Rincian dan formulir lanjutan dibuka saat diperlukan.

Lima menu utama: **Beranda · Catatan · Rencana · Laporan · Lainnya**. Rencana membagi Tabungan, Anggaran, dan Jadwal menjadi tiga tab. Lainnya menampilkan daftar pengaturan, kemudian satu bagian yang dipilih. Transisi halaman, panel, daftar, dan dialog lebih halus; gerak dikurangi mengikuti preferensi perangkat.

Fitur pengelolaan uang dari 1.5 tetap tersedia:

| Kebutuhan | Fitur dan lokasi |
| --- | --- |
| Memisahkan uang tunai, bank, e-wallet | **Beranda → Dompet**. Saldo per dompet, pemindahan uang tanpa menambah pemasukan/pengeluaran, serta riwayat transfer. |
| Mengingat uang jajan atau tagihan | **Rencana → Jadwal**. Jadwal mingguan/bulanan, konfirmasi atau otomatis saat aplikasi dibuka, pengingat lokal opsional. |
| Membatasi belanja | **Rencana → Anggaran**, untuk batas keseluruhan dan per kategori. Peringatan dalam aplikasi pada 80% dan 100%. |
| Memutuskan belanja hari ini | **Beranda → Boleh jajan hari ini?**. Simulasi nominal dan kategori, memperhitungkan saldo, tujuan tabungan, pengeluaran hari ini, dan kebutuhan terjadwal. |
| Memahami pola pengeluaran | **Laporan → Saran untukmu**: perbandingan tujuh hari, kategori Lainnya yang dominan, perkiraan akhir bulan, dan peluang penghematan. Semua dihitung lokal. |
| Mencatat dan memperbaiki kesalahan | Tambah/edit/hapus transaksi, pencarian, filter bulan/jenis/dompet, kategori custom, ubah kategori massal, serta **Urungkan** selama 10 detik. |
| Melihat angka yang mudah dipahami | Ringkasan lebih singkat; laporan minggu/bulan dengan arus kas bersih dalam rupiah. Persentase tersedia sebagai rincian dengan dasar perhitungan. |
| Menabung untuk tujuan | **Rencana → Tabungan**. Nominal dan tenggat, alokasi/penarikan tabungan, progres, dan estimasi tabungan harian. |
| Menjaga privasi tanpa akun | **Lainnya → Privasi & widget**: kunci aplikasi opsional memakai biometrik atau PIN/pola/sandi layar perangkat. |
| Mencatat dari layar utama | **Widget Android** untuk saldo tersedia, sisa anggaran, dan tombol Catat. Nominal disembunyikan secara default; tampilan angka perlu diaktifkan sendiri. |
| Memindahkan data | **Lainnya → Cadangan & data**. JSON berpassword, impor tervalidasi dengan konfirmasi, CSV transaksi untuk spreadsheet. |

Logo memakai gambar dari pemilik yang telah dipisahkan dari latar. Bidang putih tetap dominan; hijau dipakai untuk saldo, aksi utama, dan identitas. Transisi tab, angka, grafik, tanda berhasil, dan progres tujuan menghormati preferensi pengurangan gerak. Geser kiri/kanan halaman atau navbar untuk berpindah menu; scroll vertikal untuk membaca.

## Memasang atau memperbarui

1. Unduh `Saku-1.5.7.apk` dari tautan resmi di atas. AAB adalah berkas distribusi untuk Play Console, bukan berkas instalasi langsung.
2. **Jika sudah memakai Saku, ekspor cadangan terlebih dahulu.** Pasang pembaruan di atas aplikasi lama; jangan uninstall atau hapus data. ID paket dan sertifikat tetap sama.
3. Android dapat meminta izin memasang aplikasi dari browser/pengelola file. Jika Play Protect meminta pemeriksaan, ikuti proses resmi Google.
4. Dari versi 1.5, data dan skema tetap sama. Dari versi lebih lama, data masuk ke **Dompet utama** dengan saldo dan riwayat tetap. Tambahkan dompet lain dan gunakan transfer untuk membagi uang yang sudah tercatat.

Skema cadangan terbaru adalah **v3** dan memerlukan Saku 1.5 atau lebih baru. Cadangan lama skema v1/v2 tetap dapat diimpor. Jangan downgrade setelah migrasi. Pembaruan ini belum diuji langsung pada perangkat; simpan cadangan lama secara terpisah.

Kode atau tanda tangan tidak menjamin peringatan Play Protect hilang. Verifikasi developer dan review toko aplikasi merupakan proses pemilik akun melalui konsol resmi. [Panduan distribusi](docs/PUBLIC-RELEASE.md).

## Jadwal, widget, dan kunci aplikasi

**Jadwal:** mode konfirmasi menunggu tombol Catat. Mode otomatis memproses kejadian saat aplikasi dibuka/aktif, bukan ketika aplikasi sudah ditutup. Maksimal 100 kejadian per batch; cursor dan transaksi disimpan bersama untuk mencegah duplikasi. Jadwal akhir bulan mempertahankan tanggal asal. Jadwal hanya mencatat uang, tidak memindahkan dana bank.

**Pengingat harian:** satu jadwal lokal berulang pada jam pilihan, default 20.00. Pengingat ini mengajak mengecek kelengkapan catatan meskipun sudah ada transaksi hari itu. Android 8+ memakai saluran berprioritas rendah, tanpa suara/getaran bawaan; Android 7 memakai berkas suara senyap. Preferensi sistem tetap berlaku. Jam/status aktif disimpan per perangkat, tidak ikut cadangan JSON. Buka Saku setelah mengganti zona waktu atau izin notifikasi agar jadwal diselaraskan.

**Pengingat jadwal rutin:** terpisah dari pengingat harian. Setelah izin diberikan, kejadian berikutnya dijadwalkan pukul 09.00 waktu perangkat. Notifikasi tidak memuat nominal atau catatan. Buka Saku untuk memperbarui pengingat berikutnya; OS dapat menundanya karena baterai/fokus. Tidak meminta izin alarm presisi.

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

ID paket `com.velorastudio.saku`, versionCode **7**, versionName **1.5.7**. APK/AAB bertanda tangan dan SHA-256 masuk `artifacts/`; kunci tidak masuk repo. [Panduan iOS](docs/IOS.md).

Batas data: 30 dompet, 20.000 transaksi, 20.000 transfer, 100 tujuan, 50 jadwal, 50 kategori custom per jenis; nominal serta jumlah saldo awal maksimal Rp1 triliun. Impor plaintext maksimal 10 MB, berkas terenkripsi maksimal 16 MB; penyimpanan native membatasi plaintext 10 MB. Skema divalidasi sebelum penulisan.

Ponytail dan Taste Skill digunakan; arah visual **Pastel consumer**, seed `1928218152`, dengan putih–hijau logo Saku dan Geist lokal. Rilis 1.5.7 menambahkan panduan berilustrasi dan pengingat harian di atas tampilan 1.5.5; perhitungan serta penyimpanan catatan tetap memakai implementasi 1.5. Build produksi dan Android diperiksa. Tidak ada screenshot atau pengujian UI/perangkat langsung; detail ada di [catatan rilis 1.5.7](docs/RELEASE-1.5.7.md). Fixture pengembangan bukan data bawaan pengguna.

## Bantuan

Gunakan Issues untuk bug/saran; sertakan versi Saku, OS, dan langkah kejadian. Jangan mengunggah cadangan, kredensial, atau transaksi pribadi ke laporan publik. Laporan kerentanan mengikuti [SECURITY.md](SECURITY.md).

Copyright © 2026 by **Velora Studio Dev**.
