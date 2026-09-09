# Verifikasi Mapping AUM Format 2–5

Tanggal pemeriksaan: 2026-09-09

## Sumber yang dibandingkan
- `CamScanner 09-09-2026 09.31.pdf`, Tabel 2–5.
- `LEMBAR JAWABAN AUM UMUM.pdf`, tabel nomor masalah Format 2–5.
- `Master_Prompt_Aplikasi_Pengolahan_AUM_Umum_Emergent_AI.docx`, komposisi resmi per format.

## Hasil
Komposisi jumlah bidang dan total format konsisten secara aritmetika:

| Format | Total resmi | Jumlah komposisi | Status rentang |
|---|---:|---:|---|
| F2 SLTP | 155 | 155 | Konflik/overlap pada transkripsi sumber |
| F3 SLTA | 200 | 200 | Konflik/overlap pada transkripsi sumber |
| F4 Perguruan Tinggi | 210 | 210 | Konflik/overlap pada transkripsi sumber |
| F5 Masyarakat | 265 | 265 | Konflik/overlap pada transkripsi sumber |

Rentang pada dua PDF tidak dapat dipakai sebagai mapping final tanpa mengarang koreksi: terdapat nomor yang muncul pada lebih dari satu bidang dan jumlah rentang yang tidak cocok dengan jumlah item bidang. Contoh yang terbaca jelas adalah nomor/rentang yang berulang antara JDK–DPI, KHK–WSG, serta bidang lain pada Format 2–5.

## Keputusan implementasi
- Scoring engine tetap memblokir nomor di luar rentang, duplikasi, dan masalah berat yang bukan subset.
- Konfigurasi sementara mempertahankan jumlah item resmi setiap bidang dan membuat nomor unik melalui `repair_ranges` deterministik agar aplikasi dapat diuji end-to-end.
- Status konfigurasi F2–F5 ditandai `source_conflict_provisional` pada `/api/formats` dan `/api/formats/verification`; hasil tersebut belum boleh dianggap verifikasi mapping resmi.
- Mapping final harus dikunci setelah pemilik dokumen memberikan tabel asli yang tidak ambigu atau koreksi tertulis per rentang.