# AUM Umum BK Mobile — Product Requirements

## Ringkasan Produk
Aplikasi mobile Expo/React Native untuk Guru BK melakukan input, pengolahan, analisis, dan pelaporan Alat Ungkap Masalah (AUM) Umum secara deterministik dan rahasia.

## Pengguna & Mode
- **Guru BK** dengan autentikasi email/password (JWT) atau **Masuk Demo Instan**.
- **Mode Demo**: data contoh terpisah untuk mencoba tanpa data pribadi.
- **Mode Data Nyata**: data terkunci per akun (owner_id) — satu Guru BK bisa mengelola banyak sekolah.

## Format AUM yang Didukung
| Format | Target | Total Item |
|---|---|---|
| F1 | Siswa SD | 75 |
| F2 | Siswa SLTP | 155 |
| F3 | Siswa SLTA | 200 |
| F4 | Mahasiswa Perguruan Tinggi | 210 |
| F5 | Warga Masyarakat | 265 |

Bidang: JDK, DPI, HSO, EDK, KDP, PDP, ANM, HMM, HPW (F5), KHK, WSG. Mapping Format 1 = konsisten dengan sumber; Format 2–5 = `source_conflict_provisional` (repair deterministik untuk rentang PDF sumber yang tumpang tindih; jumlah item resmi dipertahankan). Status transparan pada `/api/formats/verification`.

## Fitur Utama
1. **Ringkasan** — dashboard: sekolah aktif, metrik responden/kelas/masalah, aktivitas terbaru, shortcut Rekap.
2. **Database** — multi-sekolah per akun, kelas per sekolah, responden per kelas; Import Excel transaksional + template unduh; tap responden = buka hasil individual dengan rincian per bidang.
3. **Wizard 3 Langkah AUM** — Langkah 1 (nama, ID, jenis kelamin, kelas, format, nomor masalah), Langkah 2 (masalah berat = subset Langkah 1), Langkah 3 (kelengkapan, masalah lain, keinginan konseling).
4. **Analitik** — 3 mode dalam satu tab:
   - **Kelas**: JML, %, min, max, rata, JML berat, rata berat, ranking bidang.
   - **Rekap Sekolah**: agregasi lintas kelas, distribusi per bidang, ringkasan per kelas.
   - **Bandingkan Kelas**: matrix bidang × kelas.
5. **Audit** — log perhitungan + telusuri per responden dengan rumus per bidang.
6. **Export** — PDF & XLSX (individual & kelompok) via `expo-sharing`.

## Prinsip Rahasia & Deterministik
- Skor dihitung algoritma deterministik, tanpa AI/ML.
- Tidak ada kategori diagnosis (rendah/tinggi/gangguan psikologis).
- Data mentah terpisah dari hasil; hasil dapat dihitung ulang.
- Setiap perhitungan bisa ditelusuri (`/api/audit/individual/{id}`).

## Arsitektur
- **Frontend**: Expo Router, single `/app/frontend/app/index.tsx`, bottom 4 tabs, theme dari `src/theme.ts`.
- **Backend**: FastAPI + MongoDB. Semua endpoint prefix `/api`.
- **Auth**: JWT (HS256), bcrypt.
- **Import**: pandas + openpyxl transaksional.
- **Export**: reportlab (PDF), openpyxl (XLSX).

## Endpoint Utama
- `/api/auth/{login|register|demo|me}`
- `/api/formats`, `/api/formats/verification`
- `/api/schools` GET/POST, `/api/classes?school_id=` GET/POST
- `/api/respondents` GET/POST
- `/api/scoring/{individual|group}` POST
- `/api/rekap/school/{id}`, `/api/rekap/comparison?school_id=`
- `/api/audit`, `/api/audit/individual/{id}`
- `/api/import/{excel|template}`
- `/api/export/{individual|group}/{id}?format=xlsx|pdf`

## Roadmap Berikutnya
- Verifikasi manual mapping Format 2–5 saat user memberikan tabel resmi.
- Multi tahun ajaran per sekolah, filter tahun.
- Backup & unduh seluruh data akun.
