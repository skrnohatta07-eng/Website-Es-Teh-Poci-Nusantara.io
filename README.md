# Es Teh Poci Nusantara — PHP + jQuery

Versi ini sudah mengaktifkan integrasi **PHP + jQuery**.

## Alur
1. `index.html` memuat `jquery.min.js`, kemudian `jquery.js`, kemudian `script.js`.
2. `jquery.js` mengambil konfigurasi toko melalui `GET api.php?action=config` menggunakan jQuery AJAX.
3. Saat tombol **Kirim lewat WhatsApp** diklik, jQuery mengambil data keranjang dari `localStorage`, data pelanggan, metode pengambilan, promo, dan total.
4. Data dikirim menggunakan `POST api.php?action=order` dengan format JSON.
5. `api.php` memvalidasi dan menyimpan pesanan ke `data/orders.json`.
6. WhatsApp tetap dibuka seperti alur website sebelumnya.

## Menjalankan
Jangan membuka `index.html` dengan `file://`. Gunakan server PHP, misalnya XAMPP:

- Salin folder proyek ke `htdocs`.
- Jalankan **Apache** di XAMPP.
- Buka `http://localhost/Web%20Test/` atau alamat folder sesuai nama folder di komputer.

Alternatif terminal:   

```bash
php -S localhost:8000
```

lalu buka `http://localhost:8000/`.

## File penting
- `index.html` — memuat library jQuery dan script aplikasi.
- `jquery.min.js` — library jQuery lokal (tidak bergantung CDN).
- `jquery.js` — kode jQuery untuk AJAX PHP dan efek UI.
- `script.js` — logika utama website dan keranjang.
- `api.php` — backend PHP.
- `data/config.json` — konfigurasi toko untuk endpoint PHP.
- `data/orders.json` — penyimpanan pesanan sederhana berbasis JSON.

## Catatan
Folder `data` harus memiliki izin tulis agar PHP dapat menyimpan pesanan.
