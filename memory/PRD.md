# PRD — AUM Umum BK Mobile

## Problem statement
Membangun sistem mobile untuk Guru BK yang mengikuti Master Prompt Aplikasi Pengolahan AUM Umum dan dokumen sumber lampiran: input responden, pemilihan masalah, masalah berat, informasi tambahan, pengolahan deterministik, hasil individual/kelompok, rekap, audit, dan pengelolaan data rahasia.

## Architecture
- Frontend: Expo React Native + Expo Router entry + TypeScript, safe-area aware, four-area mobile workspace.
- Backend: FastAPI pada port 8001 dengan endpoint `/api`, validasi server-side, deterministic AUM Scoring Engine.
- Database: MongoDB melalui Motor; collections konfigurasi (`aum_formats`, `aum_items`), data mentah (`respondents`), hasil (`processing_results`), sekolah/kelas, dan `audit_logs`.
- Configuration: five format configurations are seeded as editable database data with domain counts and item mappings; scoring validates total items and heavy-problem subset rules before producing results.
- Privacy: demo mode is isolated from real mode, reports use non-diagnostic language, and audit output exposes formulas.

## User personas
- Guru BK: memasukkan dan meninjau AUM individual, mengelola kelas, serta menyiapkan tindak lanjut layanan.
- Koordinator BK: melihat profil kelompok, rekap kelas, perbandingan bidang, dan audit perhitungan.
- Administrator: menjaga konfigurasi format, backup, integritas data, dan audit trail.

## Core requirements (static)
1. Lima format: SD 75, SLTP 155, SLTA 200, Perguruan Tinggi 210, Masyarakat 265 item.
2. Bidang dan kode AUM mengikuti sumber, termasuk HPW untuk Format 5.
3. Wizard tiga langkah: masalah terpilih, masalah berat sebagai subset, dan informasi tambahan.
4. Individual: jumlah, persentase, nomor masalah, masalah berat, dan audit rumus.
5. Kelompok: minimum, maksimum, JML, persentase, rata-rata, JML berat, dan rata-rata berat.
6. Tidak memakai AI untuk menentukan skor dan tidak membuat diagnosis/kategori baru.
7. Data mentah dipisahkan dari hasil olahan dan dapat ditelusuri.
8. Mode Demo dan Data Nyata terpisah; data pribadi bersifat rahasia.
9. Dashboard, database sekolah, analitik, audit, import template, serta export actions.

## Implemented

### 2026-09-09
- Mengganti starter screen dengan AUM Umum BK Mobile: auth/demo entry, dashboard KPI, database kelas/responden, analitik kelompok, audit, dan bottom navigation.
- Menambahkan wizard tiga langkah dengan identitas, lima pilihan format, pencarian nomor, masalah berat, pertanyaan tambahan, validasi, dan penyimpanan.
- Menambahkan FastAPI scoring engine deterministik, konfigurasi lima format, seed demo terpisah, API dashboard, schools/classes/respondents, individual/group scoring, dan audit logs.
- Menampilkan hasil AUM individual lengkap dengan total, persentase keseluruhan, per bidang, masalah berat, dan frasa non-diagnostik.
- Mengisi design tokens sesuai `design_guidelines.json`, memperbaiki TypeScript tema Expo, dan menambahkan paket `@expo/vector-icons`.
- Backend health, format totals, scoring, group scoring, subset validation, dan alur preview mobile telah diuji: lulus 100% pada iteration 1.

## Prioritized backlog

### P0 — sebelum data nyata
- Verifikasi ulang setiap nomor item Format 2–5 terhadap tabel resmi sumber asli bila tersedia dalam bentuk tabel yang tidak ambigu; konfigurasi backend sudah editable dan total/domain validation sudah aktif.
- Implementasikan autentikasi akun Guru BK persisten, role-based access, HTTPS deployment policy, dan session expiry.
- Implementasikan import Excel transactional dengan validasi per baris dan rollback penuh.
- Implementasikan export PDF/Excel nyata dengan data yang sama persis dengan hasil aplikasi.

### P1 — peningkatan operasional
- Form pengaturan sekolah/tahun ajaran/jenjang/kelas dan mode Data Nyata end-to-end.
- Backup/restore MongoDB, secure deletion, audit trail perubahan data mentah, dan regenerate result dari raw responses.
- Rekap sekolah lintas kelas/jenjang dan perbandingan beberapa kelas pada satu layar.
- Filter analitik berdasarkan gender/jenjang dan detail kontribusi tiap responden.

### P2 — penyempurnaan
- Import daftar siswa lebih cepat dengan template yang dapat diunduh langsung.
- Pencarian histori hasil dan penyaringan berdasarkan rentang tanggal.
- Pengaturan profil Guru BK dan preferensi tampilan.

## Next tasks
1. Kunci mapping resmi setelah verifikasi dokumen sumber tabel.
2. Lengkapi auth produksi dan pembatasan akses sekolah.
3. Tambahkan pipeline import/export berbasis file dan automated regression dataset 10 responden per format.