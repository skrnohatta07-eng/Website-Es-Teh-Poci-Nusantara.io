// gabung.js  ->  menggabungkan berkas di folder bagian/ menjadi index.html
//
// Cara pakai (perlu Node.js):
//     node gabung.js
//
// Alur kerja: ubah tampilan di berkas dalam folder bagian/ (misalnya 03-menu.html),
// lalu jalankan perintah di atas. index.html akan dibuat ulang otomatis.
// Urutan bagian diatur di bagian/_kerangka.html.

const fs = require("fs");
const path = require("path");

const folder = path.join(__dirname, "bagian");
const kerangka = fs.readFileSync(path.join(folder, "_kerangka.html"), "utf8");
const dipakai = [];

const hasil = kerangka.replace(/^([ \t]*)<!-- @include (.+?) -->[ \t]*$/gm, (_, indent, nama) => {
  const berkas = path.join(folder, nama.trim());
  if (!fs.existsSync(berkas)) {
    console.error("Berkas tidak ditemukan: bagian/" + nama.trim());
    process.exit(1);
  }
  dipakai.push(nama.trim());
  const isi = fs.readFileSync(berkas, "utf8").replace(/\s+$/, "");
  return isi.split("\n").map((baris) => (baris.trim() ? indent + baris : baris)).join("\n");
});

fs.writeFileSync(path.join(__dirname, "index.html"), hasil);
console.log("index.html dibuat dari " + dipakai.length + " bagian:");
dipakai.forEach((n) => console.log("  - bagian/" + n));
