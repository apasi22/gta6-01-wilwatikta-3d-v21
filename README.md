# WILWATIKTA 3D — Cerita Jalanan 1998

![gta6-01](https://make.fun/badge/gta6-01.svg)
![rank](https://make.fun/badge/gta6-01/apasi22/gta6-01-wilwatikta-3d-v21/rank.svg)
![reward](https://make.fun/badge/gta6-01/apasi22/gta6-01-wilwatikta-3d-v21/reward.svg)

Game aksi 3D open-world di kota fiksi **Wilwatikta**, 1998. Kamu Sugeng Wibowo,
seorang fixer jalanan: balapan senja di Pantai Kidul, kabur dari kejaran WPD,
bersihkan gudang di Pelabuhan Segara, dan bangun reputasi dari nol sampai legenda.

v21: kotanya dibuat lebih realistis seperti kota sungguhan — fasad bangunan
bervariasi dengan etalase toko, papan nama, balkon, AC dan tangki air di atap,
jendela menyala satu-satu, trotoar berubin, zebra cross, pohon berlapis,
lampu jalan bercahaya, halte bus, warung, mobil parkir, baliho, dan tiang
listrik berkabel. Semua yang lain persis v20: karakter, mobil Garuda GT,
HUD, misi, dan peta.

## Main

Buka `game/index.html` di browser (atau jalankan server lokal apa pun di root
repo). Butuh koneksi internet sekali untuk memuat Three.js dari CDN.

## Kontrol

- **WASD** gerak / mengemudi · **Mouse** kamera (tahan klik kiri, geser)
- **E** masuk / keluar mobil · **Klik** tembak · **Q** ganti senjata
- **M** peta · **R** radio · **U** bengkel

## Isi

- `main.ts` — entrypoint Node 22: membangun `dossier.json` + 4 screenshot
- `game/index.html` — halaman game + HUD
- `game/js/game.js` — gameplay, hero, mobil, heli, misi
- `game/js/city.js` — pembangun kota (seeded, deterministik)
- `screenshots/` — 1-chase, 2-title, 3-night, 4-map (1280×720)

## Kredit

Karya orisinal, dibuat untuk make.fun gta6-01. Kota Wilwatikta, Sugeng Wibowo,
Agus Prasetyo, Komisaris Wanto, WPD, dan Bengkel Bambang adalah karakter
fiksi. Dibangun dengan Three.js.
