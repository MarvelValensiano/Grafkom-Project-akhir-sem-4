# Aplikasi Grafika Komputer 2D

Project akhir mata kuliah Grafika Komputer dan Multimedia berbasis JavaScript menggunakan HTML5 Canvas.

## Deskripsi Project

Aplikasi ini merupakan mini graphics editor sederhana yang dibuat untuk mengimplementasikan konsep dasar grafika komputer 2D, meliputi:

* Algoritma pembentukan garis
* Algoritma pembentukan lingkaran
* Algoritma pembentukan elips
* Transformasi 2D
* Animasi objek
* Interaksi pengguna pada canvas

Aplikasi dibuat menggunakan:

* HTML5
* CSS3
* JavaScript
* HTML5 Canvas API

---

# Fitur Aplikasi

## 1. Pembentukan Objek Grafika

### Garis DDA

Menggambar garis menggunakan algoritma DDA (Digital Differential Analyzer).

### Lingkaran Midpoint

Menggambar lingkaran menggunakan algoritma Midpoint Circle.

### Elips Midpoint

Menggambar elips menggunakan algoritma Midpoint Ellipse.

---

# 2. Transformasi 2D

## Translasi

Menggeser objek menggunakan:

* Keyboard arrow
* Drag and drop mouse

## Scaling

Memperbesar dan memperkecil objek.

## Rotasi

Memutar objek menggunakan keyboard.

---

# 3. Sistem Interaksi

* Realtime preview object
* Object selection
* Drag and drop
* Color picker
* Perubahan warna object
* Undo & Redo
* Clear canvas

---

# 4. Animasi

Objek dapat:

* Bergerak otomatis
* Memantul pada batas canvas
* Bergerak realtime menggunakan animation loop

---

# Struktur Folder

```text
project-grafika-komputer/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

---

# Cara Menjalankan Project

## 1. Clone Repository

```bash
git clone <URL_REPOSITORY>
```

## 2. Masuk Folder Project

```bash
cd project-grafika-komputer
```

## 3. Jalankan Project

Buka file:

```text
index.html
```

menggunakan browser.

Atau gunakan extension:

* Live Server (VS Code)

---

# Cara Penggunaan Aplikasi

# Menggambar Garis

1. Klik tombol "Garis DDA"
2. Klik titik awal pada canvas
3. Klik titik akhir

---

# Menggambar Lingkaran

1. Klik tombol "Lingkaran"
2. Klik titik pusat
3. Klik untuk menentukan radius

---

# Menggambar Elips

1. Klik tombol "Elips"
2. Klik titik pusat
3. Klik untuk menentukan ukuran elips

---

# Translasi Objek

## Menggunakan Keyboard

1. Klik tombol "Translasi"
2. Pilih object
3. Gunakan:

* Arrow Up
* Arrow Down
* Arrow Left
* Arrow Right

## Menggunakan Mouse

1. Klik tombol "Translasi"
2. Klik object
3. Drag object menggunakan mouse

---

# Scaling Object

1. Klik tombol "Scaling"
2. Pilih object
3. Gunakan keyboard:

* * untuk memperbesar
* * untuk memperkecil

Catatan:
Pada beberapa keyboard, tombol + menggunakan Shift + =.

---

# Rotasi Object

1. Klik tombol "Rotasi"
2. Pilih object
3. Gunakan:

* Q untuk rotasi kiri
* E untuk rotasi kanan

---

# Mengubah Warna Object

1. Pilih object
2. Gunakan color picker
3. Warna object akan berubah otomatis

Jika tidak ada object yang dipilih:

* warna akan digunakan untuk object baru

---

# Undo dan Redo

## Undo

Klik tombol:

```text
Undo
```

## Redo

Klik tombol:

```text
Redo
```

---

# Menjalankan Animasi

Klik tombol:

```text
Animasi
```

Object akan:

* bergerak otomatis
* memantul pada batas canvas

---

# Konsep Grafika Komputer yang Digunakan

## Algoritma Garis

* DDA Line Algorithm

## Algoritma Lingkaran

* Midpoint Circle Algorithm

## Algoritma Elips

* Midpoint Ellipse Algorithm

## Transformasi 2D

* Translasi
* Scaling
* Rotasi

## Rendering

* Pixel plotting
* Realtime redraw canvas

## Interaksi

* Event handling
* Mouse interaction
* Keyboard interaction

## Animasi

* RequestAnimationFrame
* Collision detection
* Motion system

---

# Pengembangan Selanjutnya

Beberapa fitur yang dapat dikembangkan:

* Save & Load Project JSON
* Export PNG
* Fill Area Algorithm
* Bresenham Line Algorithm
* Layer System
* Sidebar UI
* Grid Canvas
* Resize Object Handle
* Multiple Object Selection
* Delete Object

---

# Anggota Kelompok

Tambahkan anggota kelompok di sini.

Contoh:

1. Nama Ketua Kelompok
2. Nama Anggota 1
3. Nama Anggota 2

---

# Catatan

Project ini dibuat untuk memenuhi tugas akhir mata kuliah Grafika Komputer dan Multimedia.

---

# Lisensi

Project ini digunakan untuk kebutuhan pembelajaran dan akademik.


## Tambahan Bangun
- Persegi
- Segitiga
