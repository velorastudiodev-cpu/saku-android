> Catatan tahap pengerjaan 1.3, bukan rilis publik terpisah. Instruksi terbaru pemilik memperluas pekerjaan sampai 1.5 dan menyediakan logo. Lihat [rilis gabungan 1.5](RELEASE-1.5.md) untuk status akhir.

# Saku 1.3 — Polish & Daily Experience

Ponytail: implementasi terbatas sesuai roadmap yang dikonfirmasi pemilik. Tidak menambahkan multi-dompet, anggaran kategori, widget, app lock, Boleh Jajan, atau Insight 2.0; masing-masing tetap untuk 1.4/1.5.

Taste Skill: pertahankan Achromatic ledger, seed 1792834316, Geist dan warna yang ada. Tidak redraw. Pertanyaan Ringkasan: berapa uang yang tersedia dan apa yang perlu dicatat hari ini? Saldo, status anggaran, transaksi terbaru menjadi urutan utama. Grafik lengkap berada di Laporan. Motion hanya umpan balik 180–220 ms, tanpa animasi scroll berulang; reduced motion dihormati.

Tahap:
1. Skema data 2 dengan migrasi skema 1, kategori custom dan pemrosesan jadwal yang idempoten.
2. UI ringkas, rupiah sebagai informasi utama arus kas, kategori massal, jadwal, dan Undo.
3. Animasi ringan, ikon status bar Android gelap, cadangan berpassword.
4. Proyek iOS, penyimpanan terenkripsi lokal, panduan build/signing Apple; APK/AAB Android diperbarui.

Jadwal berjalan offline. Mode konfirmasi menjadi default. Mode otomatis memproses kejadian yang jatuh tempo saat aplikasi dibuka/aktif; OS hanya mengirim pengingat lokal saat aplikasi tertutup. Tidak menjanjikan eksekusi latar belakang tepat waktu. Jadwal bulanan menjaga tanggal asal, dengan penyesuaian akhir bulan.

Foto pengganti logo belum tersedia pada awal pengerjaan. Tidak menggunakan gambar asumsi. Mesin ini Linux: tidak dapat membangun/menandatangani IPA atau mengonfirmasi perilaku iPhone tanpa Xcode/perangkat Apple.

Ikuti preferensi pemilik untuk menghindari screenshot dan pengujian perangkat; pemeriksaan difokuskan pada build dan logika kritis. Tidak membuat data contoh menjadi data produksi.
