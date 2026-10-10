# Web Test — Es Teh Poci Nusantara

Website pemesanan Es Teh Poci Nusantara dengan frontend HTML, CSS, JavaScript/jQuery, backend PHP, dan database MySQL.

## Struktur proyek

```text
Web Test/
├── index.html                 # Halaman utama website
├── style.css                  # Gaya dan tata letak
├── script.js                  # Logika antarmuka dan keranjang
├── jquery.min.js              # Library jQuery
├── jquery.js                  # AJAX dan efek antarmuka khusus proyek
├── api.php                    # Backend PHP dan koneksi MySQL
├── database.sql               # Struktur tabel dan data awal MySQL
├── gabung.js                  # Skrip opsional untuk merakit index.html dari bagian/
├── bagian/                    # Potongan HTML sumber
├── gambar/                    # Logo, favicon, dan gambar menu
└── data/
    └── config.json            # Konfigurasi lokal lama/cadangan
```

## Persyaratan

- XAMPP (Apache dan MySQL)
- PHP dengan ekstensi PDO MySQL aktif
- Browser modern

## Menjalankan di komputer lokal

1. Ekstrak folder `Web Test` ke `C:\xampp\htdocs\Web Test`.
2. Buka XAMPP Control Panel dan jalankan **Apache** serta **MySQL**.
3. Buka `http://localhost/phpmyadmin`.
4. Pilih menu **Impor**, lalu pilih `database.sql`.
5. Setelah impor selesai, buka `http://localhost/Web%20Test/`.

Database yang digunakan aplikasi adalah `esteh_poci`. Pengaturan koneksi default di `api.php` adalah host `127.0.0.1`, pengguna `root`, dan kata sandi kosong. Ubah konstanta koneksi di `api.php` jika pengaturan MySQL lokal berbeda.

## Pengujian database

- Buka website dan buat pesanan percobaan.
- Di phpMyAdmin, pilih database `esteh_poci`.
- Periksa tabel `orders` dan `order_items` untuk memastikan pesanan tersimpan.

## Catatan

- `database.sql` berisi skema tabel dan data awal. Impor ulang database dapat menimpa data awal tertentu; cadangkan database sebelum mengimpor ulang.
- Data yang dibuat saat website dijalankan tersimpan di MySQL lokal, bukan otomatis di GitHub.
- `bagian/` dan `gabung.js` merupakan sumber untuk menyusun ulang `index.html`; website yang dijalankan langsung menggunakan `index.html`.
- Jangan menyimpan kata sandi produksi, kredensial pribadi, atau data pelanggan nyata di repository publik.
