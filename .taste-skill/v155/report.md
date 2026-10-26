# Saku 1.5.5: keputusan tampilan

Ponytail + Taste app-screen run. Arah **Pastel consumer**, seed `1928218152`, tanpa redraw lanjutan. Pilihan ini mendukung pemakaian singkat harian dan bidang putih dengan aksen hijau dari logo, sesuai permintaan pemilik setelah masukan pengguna.

## Bahan yang nyata

- Pengguna membuka catatan keuangan pribadi di ponsel, tanpa akun atau koneksi internet.
- Saldo tersedia berasal dari jumlah saldo dompet dikurangi alokasi tujuan.
- Rupiah utuh, termasuk nol, saldo minus, dan nominal besar, memakai formatter bersama.
- Transaksi memiliki jenis, nominal, tanggal, kategori, catatan, serta dompet.
- Dompet memiliki saldo; transfer internal mempertahankan jumlah total uang.
- Anggaran memiliki periode bulanan; kategori memiliki batas dan pemakaian.
- Tujuan memiliki target, alokasi, dan tenggat; jadwal memiliki tanggal berikutnya.
- Insight berasal dari catatan lokal, tanpa angka pemasaran atau data contoh bawaan.
- Logo dompet hijau milik pemilik tetap dipakai. Boleh Jajan adalah elemen khas Saku.
- Fitur utama yang perlu satu ketukan: mencatat pengeluaran dan pemasukan.

## Satu pertanyaan per tujuan

| Tujuan | Pertanyaan utama | Tindakan |
| --- | --- | --- |
| Beranda | Berapa uang yang masih bisa dipakai? | Catat pengeluaran/pemasukan |
| Dompet | Uangku tersimpan di mana? | Kelola dompet atau pindahkan catatan saldo |
| Catatan | Uang masuk/keluar untuk apa? | Cari, filter, atau edit catatan |
| Rencana | Bagaimana mengatur uang berikutnya? | Pilih Tabungan, Anggaran, atau Jadwal |
| Laporan | Bagaimana pola uangku? | Pilih periode dan baca rincian/saran |
| Lainnya | Pengaturan mana yang dibutuhkan? | Buka satu bagian pengaturan |

## Pemetaan visual

Dasar `#f5f8f6`, bidang putih, tinta `#193c30`, aksen `#147d59`, hijau muda `#e8f4ed`. Geist dimuat dari aset lokal. Grafik memakai hijau dan hijau keabu-abuan; pengeluaran biasa tidak seluruhnya merah. Warna peringatan khusus keadaan yang perlu perhatian. Panel 20px, kontrol 12px, ruang tepi ponsel 16px, target sentuh minimal 44px. Dua kolom pada area saldo/simulasi desktop menjadi satu kolom di ponsel.

Rincian disembunyikan melalui disclosure yang diberi nama; data utama dan tindakan berikutnya tetap terlihat. Bukan penghapusan fitur. Bidang putih dominan, tanpa gradient, glass, atau kartu berbayang. Bayangan hanya dipakai dialog dan toast.

Pemilik meminta lebih banyak animasi: transisi halaman dan panel singkat, indikator navigasi bergerak, dialog masuk sebagai sheet, feedback tekan/simpan, angka dan progres berubah halus. Tidak ada animasi idle, scroll observer, atau penundaan penyimpanan untuk menunggu animasi. CSS dan animasi halaman/angka menghormati reduced motion.

## Batas penilaian

Lint sumber: 0 FAIL, 4 WARN. Padding tanggal, bayangan overlay, dan penanda angka kosong dipertahankan karena membawa makna. Kompilasi TypeScript/Vite serta kemasan Android diperiksa. Tidak menjalankan browser inspector atau screenshot atas preferensi pemilik; tidak mengklaim skor visual, hasil uji aksesibilitas browser, atau validasi perangkat. Referensi uji UI diperbarui tanpa menjalankannya. Tidak mengganti data pengguna dengan fixture.
