# Wilwatikta 3D — Cerita Jalanan 1998

[![Wilwatikta 3D on make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/apasi22/gta6-01-wilwatikta-3d-v21/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/apasi22/gta6-01-wilwatikta-3d-v21/reward.svg)](https://make.fun/bounty/gta6-01)

Open-world 3D di kota pesisir fiktif **Wilwatikta, Jawa, tahun 1998**. **Sugeng Wibowo**,
fixer jalanan, balapan siang di boulevard pantai, kabur dari **WPD** (Wilwatikta Police
Department), dan membersihkan gudang di Pelabuhan Segara — dengan **Garuda GT** oranye,
helikopter WPD di atas kepala, dan kru Jawa yang bisa direkrut.

Lihat kompetisinya di [make.fun — gta6-01](https://make.fun/bounty/gta6-01).

## Mainkan

Buka `game/index.html` di browser desktop (butuh HTTP, bukan `file://`, karena
gamenya memakai ES module):

```sh
cd game && python3 -m http.server 8123
# buka http://localhost:8123/index.html
```

Atau jalankan build entry-nya:

```sh
node main.ts
# game/ + screenshots/ disalin ke /output, dossier ditulis ke /output/dossier.json
```

## Game

- **6 distrik**: Pelabuhan Segara, Kampung Batik, Lorong Emas, Pantai Kidul,
  Alun-Alun, Pasar Senja — lengkap dengan toko, bengkel, dan safehouse.
- **12 misi bernomor**, dari Selamat Datang sampai The Last Ride.
- **Kru**: Sugeng, Agus, Wanto, Bambang, Ratna, Slamet — masing-masing dengan
  potret dan harga rekrut.
- **Kendaraan**: Garuda GT (mobil hero), helikopter WPD dengan lampu sorot,
  mobil polisi WPD, dan mobil parkir warna-warni.
- **HUD lengkap**: panel misi, minimap bulat, bar HEALTH/ARMOUR/RESPECT,
  panel unit WPD, slot senjata bernomor dan berharga, dialog karakter,
  radio Gamelan FM 101.1, dan layar peta GPS.
- **Kontrol**: WASD gerak, mouse kamera, E masuk mobil, klik tembak,
  Q ganti senjata, M peta, R radio, U bengkel.

## Teknologi

Three.js r160 (vendored di `game/vendor/three.min.js`), tanpa build step dan
tanpa dependensi jaringan. Kode game ditulis segar untuk kompetisi ini.
