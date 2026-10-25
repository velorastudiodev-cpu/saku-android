# Saku untuk iOS — status 1.5.0

**Proyek native tersedia; belum ada IPA yang ditandatangani, build Xcode, atau pengujian iPhone.** APK Android tidak bisa dipasang di iPhone. Pengerjaan dilakukan pada Linux, sehingga hasil kompilasi Swift/SDK Apple dan perilaku iOS belum dapat dikonfirmasi.

## Yang disiapkan

- Proyek Xcode di `ios/App/App.xcodeproj`, scheme `App`, bundle ID `com.velorastudio.saku`, versi 1.5.0 build 5, target minimum iOS 15.4. Minimum ini juga mendukung dialog dan API browser yang dipakai aplikasi.
- SakuViewController terdaftar pada SceneDelegate dan storyboard; plugin SecureWallet memakai CryptoKit AES-256-GCM serta kunci Keychain `WhenUnlockedThisDeviceOnly` tanpa sinkronisasi iCloud.
- Berkas data menggunakan atomic write, complete file protection, dan pengecualian backup. Kata sandi cadangan portabel independen dari kunci perangkat.
- Light theme/status bar gelap, pengingat lokal opsional, berbagi berkas native, dan manifest privasi untuk UserDefaults serta timestamp berkas aplikasi.
- Ikon dan splash memakai logo hijau yang diberikan pemilik, dengan latar netral.
- Kunci aplikasi opsional melalui LocalAuthentication (Face ID/Touch ID/passcode), teks izin Face ID, pemeriksaan sesi pada akses ledger, dan penutup layar ketika tidak aktif.
- Fitur lintas platform v1.5 tersedia dalam UI bersama: multi-dompet, transfer, anggaran kategori, Boleh Jajan, dan insight. Widget hanya untuk Android.

## Membuka di Mac

1. Siapkan Mac dengan Xcode dan SDK yang kompatibel dengan Capacitor 8, Node.js 22+, serta perangkat/simulator iOS yang didukung. Swift Package Manager akan menyelesaikan dependensi build; koneksi saat pengembangan tidak berarti aplikasi membutuhkan koneksi saat dipakai.
2. Clone repo, jalankan `npm ci`, kemudian `npm run ios:sync`.
3. Jalankan `npx cap open ios` atau buka `ios/App/App.xcodeproj`.
4. Pada target **App → Signing & Capabilities**, pilih Team milik Anda dan pastikan bundle ID dapat dipakai oleh akun tersebut. Tidak ada kredensial/profil signing Apple di repo.
5. Pilih perangkat/simulator dan lakukan build. Untuk distribusi TestFlight/App Store, gunakan akun Apple Developer yang sesuai, Archive, lalu alur distribusi Xcode/App Store Connect.

Build dan proses signing Apple belum dilakukan oleh agen. Jangan menganggap proyek siap dikirim ke App Store sebelum pemeriksaan Xcode, ketentuan distribusi, pertanyaan kepatuhan enkripsi, dan pengujian perangkat diselesaikan oleh pemilik.

## Sebelum menyatakan dukungan iOS terkonfirmasi

Pastikan pembukaan pertama, penyimpanan/pembukaan ulang setelah proses dihentikan, cadangan berpassword lintas Android/iOS, pemilih file, pengingat, pembatalan autentikasi, penguncian saat latar belakang, penutup app switcher, safe area, keyboard, dan reduced motion berfungsi pada perangkat target. Kunci Keychain tidak mengikuti perpindahan perangkat; gunakan cadangan portabel berpassword. Tidak ada login atau backend.
