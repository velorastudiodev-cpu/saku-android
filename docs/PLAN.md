# Saku — rencana implementasi

Ponytail full digunakan untuk satu aplikasi lokal tanpa server. Taste Skill app run digunakan untuk UI. Android personal, bahasa Indonesia, IDR rupiah utuh.

## Tahapan
1. Rancangan data, navigasi, dan arah visual.
2. Implementasi transaksi, laporan, tujuan, pengaturan, serta kemasan Android.
3. Unit test perhitungan, browser test alur pengguna, pemeriksaan visual 390/768/1440.
4. Build APK release, verifikasi tanda tangan, push sumber dan release ke GitHub privat.

## Data dan pekerjaan
- Satu pemilik, penggunaan singkat di Android setiap hari.
- Profil: nama panggilan, saldo awal, batas pengeluaran bulanan.
- Transaksi: ID, tanggal lokal, jenis, kategori, nominal rupiah utuh, catatan.
- Nominal umum Rp5.000–Rp3.000.000; akun baru dimulai nol.
- Saldo = saldo awal + seluruh pemasukan − seluruh pengeluaran.
- Alokasi tujuan tetap bagian saldo, bukan pengeluaran; tersedia = saldo − semua alokasi.
- Tujuan: nama, target rupiah, jumlah dialokasikan, tanggal target.
- Tambah, edit, hapus transaksi; cari dan filter riwayat.
- Laporan Senin–Minggu dan bulan kalender, tanpa tanggal UTC bergeser di perangkat.
- Surplus = pemasukan − pengeluaran; persen surplus = surplus / pemasukan × 100. Tanpa pemasukan, persen tidak terdefinisi.
- Cadangan JSON utuh dan CSV transaksi; restore divalidasi sebelum mengganti data.
- Penyimpanan lokal melalui Capacitor Preferences. Tidak ada akun cloud, token, atau API finansial.

## Arah visual
Achromatic ledger, seed 1792834316; tidak ada redraw. Font Geist lokal, angka tabular, warna biru hanya untuk seri grafik utama. Latar biru abu tipis dari dunia buku kas. Logo berupa dua lipatan saku. Chrome hitam netral; tidak ada gradient, glass, atau kartu ikon berwarna.

Signature: pecahan saldo **Tersedia / Untuk tujuan** beserta jalur pemakaian uang jajan hari ini. Ini menjawab uang mana yang masih boleh dipakai tanpa mengganggu tabungan.

Pertanyaan setiap layar:
- Ringkasan: berapa uang yang masih bisa dibelanjakan hari ini?
- Transaksi: dari mana uang datang dan ke mana pergi?
- Laporan: apakah arus kas periode ini surplus dan kategori apa yang dominan?
- Tujuan: berapa yang sudah terkumpul dan harus disisihkan per hari?
- Pengaturan: bagaimana mengatur saldo awal, anggaran, dan membawa data ke perangkat lain?

## Batas dan invarians
- Semua nominal integer aman; transaksi positif, tanggal nyata maksimal hari ini.
- Alokasi tidak menambah atau mengurangi saldo; tidak boleh melebihi saldo tersedia atau target.
- Transaksi aktual boleh menyebabkan defisit; tampilkan peringatan tanpa menyembunyikannya.
- Menghapus tujuan melepas alokasi; tidak membuat transaksi pemasukan fiktif.
- Simpan berhasil sebelum state UI berubah. Kesalahan penyimpanan terlihat.
- Akun produksi kosong. Fixture contoh hanya untuk tes/screenshot, tidak dibundel.
