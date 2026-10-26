# Saku 1.5.5 — tampilan yang lebih sederhana

Pembaruan ini menanggapi kesulitan pengguna menemukan fungsi di versi 1.5. Fokusnya adalah tampilan, navigasi, dan umpan balik saat berinteraksi. ID paket tetap `com.velorastudio.saku`, versionCode 6. Perhitungan keuangan, format data v3, penyimpanan, enkripsi, dan autentikasi perangkat menggunakan implementasi 1.5.

## Perubahan

- Putih sebagai permukaan utama, hijau dari identitas Saku untuk saldo, tombol utama, dan grafik. Tipografi Geist tetap dimuat lokal, dengan nominal sejajar dan warna pengeluaran biasa yang tenang.
- Lima menu: **Beranda, Catatan, Rencana, Laporan, Lainnya**. Navigasi tetap dapat digeser pada layar ponsel.
- Beranda menampilkan uang yang bisa dipakai, tombol Pengeluaran/Pemasukan, sisa anggaran, Boleh Jajan, serta tiga catatan terbaru. Total saldo dan alokasi tabungan tersedia di Rincian saldo.
- Dompet diakses dari Beranda. Daftar dompet, penambahan, penyuntingan, dan pemindahan uang ditampilkan dalam alur terpisah dengan satu formulir aktif.
- Catatan berfokus pada riwayat dan pencarian. Filter dibuka sesuai kebutuhan; Reset mengembalikan semua filter, termasuk jenis transaksi. Ekspor CSV hasil filter tetap menyertakan nama dompet.
- Rencana memiliki tab Tabungan, Anggaran, dan Jadwal. Batas belanja bulanan dan kategori berada bersama. Jadwal rutin menampilkan yang aktif dan jatuh tempo terlebih dahulu, dengan rincian bantuan yang bisa dibuka.
- Laporan menyimpan rincian angka/grafik dan Saran untukmu. Saran utama langsung terlihat; saran lain serta penjelasan perhitungan dapat dibuka.
- Lainnya menjadi daftar lima pilihan: Profil, Privasi & widget, Kategori, Cadangan & data, dan Tentang Saku. Hanya bagian yang dipilih menampilkan pengaturannya.
- Form transaksi langsung berfokus pada nominal. Pilihan dompet muncul saat ada lebih dari satu dompet. Tanggal, kategori, catatan, validasi, dan Urungkan tetap tersedia.
- Transisi halaman, indikator navigasi, tab rencana, pembukaan rincian/formulir, baris daftar, dan tanda berhasil menggunakan gerak singkat. Angka dan progres tetap beranimasi saat berubah. Tidak ada animasi berulang saat diam atau setiap scroll; preferensi pengurangan gerak dihormati.
- Warna dasar native Android/widget mengikuti tema baru. Ikon status bar tetap gelap pada tema terang. Versi proyek iOS diselaraskan menjadi 1.5.5 build 6.

## Pembaruan data

Tidak ada migrasi baru dari 1.5. Perubahan posisi menu tidak menghapus dompet, catatan, jadwal, kategori, atau tujuan. Cadangkan data sebelum memperbarui, lalu pasang APK di atas aplikasi lama tanpa uninstall. Pembaruan memakai sertifikat rilis yang sama.

## Pemeriksaan

- TypeScript dan build produksi Vite berhasil; aset disinkronkan dengan Capacitor.
- Source lint Taste: 0 FAIL, 4 WARN. Peringatan berkaitan dengan padding tanggal ISO, bayangan pada dua overlay (dialog/toast), dan tanda untuk angka yang tidak tersedia. Tidak ada data contoh di aplikasi rilis.
- Referensi menu pada skenario Playwright yang sudah ada disesuaikan. Skenario tersebut tidak dijalankan; perubahan ini tidak menambah tes atau fitur keuangan baru.
- Build release Android APK/AAB, penandatanganan, kesamaan sertifikat, versi, izin manifest, dan kesesuaian aset paket diperiksa sebelum publikasi.

Tidak ada screenshot, inspeksi visual browser, emulator, atau uji perangkat pada pengerjaan ini sesuai preferensi pemilik. Build tidak membuktikan kenyamanan visual, perilaku keyboard, gesture, atau pembaruan aplikasi terpasang pada seluruh perangkat. iOS tetap berupa proyek sumber tanpa build Xcode, IPA, atau konfirmasi iPhone.

## Arah desain

Ponytail dipakai untuk mempertahankan komponen, validasi, dan alur penyimpanan yang sudah tersedia. Taste Skill memakai **Pastel consumer**, seed `1928218152`, dengan warna logo dan Geist dipertahankan. Perubahan dari Achromatic ledger pada 1.5 mengikuti permintaan putih–hijau pemilik. Animasi masuk ditambahkan secara terbatas mengikuti permintaan lebih banyak animasi, dengan fallback reduced motion. Detail keputusan ada di [laporan desain](../.taste-skill/v155/report.md); tidak ada skor visual yang diklaim.
