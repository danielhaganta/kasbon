# Kasbon

Web app untuk mencatat utang piutang pribadi: siapa yang berutang ke kamu, ke siapa kamu berutang, dan berapa totalnya yang belum lunas. Dibuat untuk technical test posisi Junior Fullstack Developer.

## Demo

- URL: https://kasbon-daniel.vercel.app/
- Akun demo: `demo.kasbon@gmail.com` / `danielaja123`

Bisa juga daftar akun baru lewat halaman signup. Konfirmasi email dimatikan, jadi setelah daftar langsung masuk ke dashboard.

## Fitur

### Wajib

- **Auth** email + password (signup, login, logout). Halaman aplikasi hanya bisa dibuka setelah login, dan user yang sudah login diarahkan dari `/login` dan `/signup` ke `/`.
- **Dashboard + summary**: tiga card, yaitu "Total dihutang ke saya", "Total saya hutang", dan "Net" (hijau kalau positif, merah kalau negatif, abu-abu kalau 0).
- **List catatan**: nama, badge tipe, jumlah dalam Rupiah, tanggal relatif, badge status, dan catatan.
- **Filter** status (Semua / Belum lunas / Lunas) dan tipe (Semua / Dihutang / Saya hutang).
- **Form create/edit** dalam satu modal: tipe, nama, jumlah (dengan preview Rupiah), tanggal, dan catatan (maks 200 karakter). Error validasi tampil per field.
- **Tandai lunas** dan **Batalin lunas**, plus **hapus** dengan dialog konfirmasi.

### Bonus

- **Search** nama orang (case-insensitive, dengan debounce).
- **Sort**: Terbaru, Terlama, Jumlah terbesar, Jumlah terkecil.
- **Group per orang**: entry dengan nama yang sama digabung ("Budi: 3 entry, total Rp X") dan bisa di-expand.
- **Bar chart** total dihutang vs total saya hutang.
- **State lengkap**: skeleton saat loading, pesan error dengan tombol "Coba lagi", dua versi empty state (belum ada data dan tidak ada yang cocok dengan filter), serta toast untuk aksi berhasil/gagal.
- **Mobile-first**: form tampil sebagai bottom sheet di HP, tombol "Catat baru" mengambang di kanan bawah, area tap minimal 44px, tanpa scroll horizontal di lebar 320px.

## Tech stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS v4
- Supabase: Postgres + Auth, lewat `@supabase/supabase-js` dan `@supabase/ssr`
- lucide-react untuk ikon

Library tambahan:

- **zod (v4)**: satu schema di `src/lib/validations/debt.ts` dipakai untuk validasi di form (client) dan di route handler API (server). Type TypeScript untuk input juga diambil dari schema yang sama dengan `z.infer`, jadi aturan validasi dan type tidak bisa berbeda.

Yang sengaja dibuat sendiri tanpa library: bar chart (div + Tailwind), toast, dialog konfirmasi, dan modal form (`<dialog>` bawaan browser). Tujuannya supaya bundle tetap kecil dan setiap bagian bisa saya jelaskan baris per baris. Form juga tidak memakai library form.

## Setup lokal

Butuh Node.js 22.18 atau lebih baru (dites di Node 24) dan project Supabase.

1. Clone dan install dependency:

   ```bash
   git clone <url-repo> kasbon
   cd kasbon
   npm install
   ```

2. Salin `.env.example` ke `.env.local`, lalu isi URL project dan publishable key dari dashboard Supabase (Project Settings > API):

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

   Variabel `TEST_*` hanya dipakai untuk `npm run test:rls` (lihat bagian keamanan).

3. Jalankan migration. Pilih salah satu:
   - Buka SQL Editor di dashboard Supabase, lalu jalankan semua file di `supabase/migrations/` **berurutan** sesuai nama file.
   - Atau pakai Supabase CLI:

     ```bash
     npx supabase link --project-ref <project-ref>
     npx supabase db push
     ```

4. Generate type database (file hasil generate sudah ada di repo, jadi langkah ini hanya perlu kalau skema berubah):

   ```bash
   npx supabase gen types typescript --linked > src/types/database.ts
   ```

5. Jalankan dev server:

   ```bash
   npm run dev
   ```

   Buka http://localhost:3000.

Opsional: supaya signup langsung masuk seperti di demo, matikan "Confirm email" di Authentication > Sign In / Providers > Email. Kalau tetap aktif, setelah signup muncul pesan untuk cek email dulu.

## Struktur folder

```
src/
  app/
    (auth)/            halaman login & signup + server action auth
    (app)/             dashboard "/" + server action logout
    api/debts/         route handler GET/POST dan PATCH/DELETE per id
  components/
    debts/             komponen dashboard (summary, filter, list, form modal, chart)
    ui/                toast dan dialog konfirmasi
  hooks/               useDebts (fetch + mutasi), useDebouncedValue, useIsClient
  lib/
    supabase/          client untuk browser, server, dan proxy
    validations/       schema zod
    api/               helper response JSON dan cek auth
    format.ts          formatRupiah, formatRelativeDate, todayLocalISO
    debts.ts           search, sort, dan group per orang (fungsi murni)
  types/database.ts    type hasil generate Supabase
  proxy.ts             refresh session + redirect (Next.js 16, pengganti middleware)
supabase/migrations/   skema, RLS, dan fungsi summary
scripts/               check-format, check-debts, test-rls
```

## Database & keamanan

### Tabel `debts`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid | primary key, default `gen_random_uuid()` |
| `user_id` | uuid | default `auth.uid()`, FK ke `auth.users` dengan `on delete cascade` |
| `type` | enum `debt_type` | `owed_to_me` atau `i_owe` |
| `counterpart_name` | text | wajib, 1–100 karakter setelah di-trim |
| `amount` | bigint | wajib, harus > 0 (Rupiah, bilangan bulat) |
| `note` | text | opsional, maks 200 karakter |
| `due_date` | date | opsional |
| `settled_at` | timestamptz | `null` berarti belum lunas |
| `created_at`, `updated_at` | timestamptz | `updated_at` diisi trigger setiap update |

Ada index di `user_id` karena semua query difilter per user.

### Row Level Security

RLS aktif di tabel `debts` dengan 4 policy untuk role `authenticated`:

| Policy | Operasi | Aturan |
|---|---|---|
| `debts_select_own` | select | `using ((select auth.uid()) = user_id)` |
| `debts_insert_own` | insert | `with check ((select auth.uid()) = user_id)` |
| `debts_update_own` | update | `using` + `with check` dengan kondisi yang sama |
| `debts_delete_own` | delete | `using ((select auth.uid()) = user_id)` |

- `using` menentukan baris mana yang boleh dilihat atau disentuh. `with check` mengecek isi baris yang akan disimpan. Di update keduanya dipakai supaya user tidak bisa memindahkan catatannya ke user lain dengan mengganti `user_id`.
- `auth.uid()` dibungkus `(select ...)` supaya Postgres menghitungnya sekali per query, bukan sekali per baris.
- `revoke all on public.debts from anon`: pengunjung tanpa login tidak punya hak akses ke tabel sama sekali, jadi tetap aman walaupun suatu saat ada policy yang salah tulis.
- Client tidak pernah mengirim `user_id`. Field itu dibuang oleh zod dan diisi database dari `auth.uid()`.
- Aplikasi hanya memakai publishable key. Tidak ada service role key di kode.

### Summary dihitung di database

Total di summary dihitung oleh fungsi SQL `get_debt_summary()` yang dipanggil lewat `supabase.rpc()`. Sebelumnya total dijumlahkan di JavaScript dari hasil select, dan itu kena batas default PostgREST 1000 baris per request.

Fungsi ini memakai `security invoker`, artinya berjalan dengan hak user yang memanggil, sehingga RLS tetap berlaku dan `sum()` hanya melihat baris milik user itu. Kalau memakai `security definer`, fungsi berjalan sebagai pemiliknya, melewati RLS, dan akan menjumlahkan data semua user. Hak `execute` dicabut dari `anon` dan hanya diberikan ke `authenticated`.

### Tes kebocoran data

`scripts/test-rls.mjs` menguji RLS langsung ke REST API Supabase dengan publishable key, tanpa lewat aplikasi Next.js. Script ini butuh dua akun berbeda yang sudah bisa login:

1. Isi `TEST_A_EMAIL`, `TEST_A_PASSWORD`, `TEST_B_EMAIL`, dan `TEST_B_PASSWORD` di `.env.local`.
2. Jalankan:

   ```bash
   npm run test:rls
   ```

User A membuat satu catatan, lalu user B mencoba membaca, mengubah, menghapus, dan memalsukan `user_id`. Untuk update dan delete, script juga mengecek ulang bahwa data A memang tidak berubah. Data tes dihapus di akhir, dan script keluar dengan exit code 1 kalau ada skenario yang gagal.

![Hasil npm run test:rls](docs/rls-test.png)

```
PASS  a. Tanpa login: select debts kosong/ditolak  (42501: permission denied for table debts)
PASS  a. Tanpa login: rpc get_debt_summary ditolak  (42501: permission denied for function get_debt_summary)
PASS  b. Login user A & B (beda user)
PASS  c. A insert entry  (no error)
PASS  c. B select entry A → 0 baris  (0 baris)
PASS  c. B update entry A → 0 baris  (0 baris, data A utuh)
PASS  c. B delete entry A → 0 baris  (0 baris, entry A masih ada)
PASS  c. rpc A = total data A sendiri (termasuk entry tes)  (rpc owed_to_me=0, i_owe=12345 | select owed_to_me=0, i_owe=12345)
PASS  c. rpc B nggak ikut ngitung data A  (rpc owed_to_me=0, i_owe=0 | select owed_to_me=0, i_owe=0)
PASS  d. B insert dengan user_id A → error RLS  (42501: new row violates row-level security policy for table "debts")
PASS  e. Bersihkan data tes  (1/1 baris dihapus)

11/11 PASS
```

Bisa juga dicek manual dengan curl, memakai publishable key tanpa login:

```bash
curl "https://<project-ref>.supabase.co/rest/v1/debts?select=*" \
  -H "apikey: <publishable-key>"
```

Hasilnya HTTP 401:

```json
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT SELECT ON public.debts TO anon;","message":"permission denied for table debts"}
```

## Script lain

| Script | Yang dicek |
|---|---|
| `npm run check:format` | `formatRupiah` (contoh `Rp 1.234.000`, angka negatif, 0) dan `formatRelativeDate` untuk semua batas aturan: hari ini, kemarin, besok, X hari lagi, X hari/minggu/bulan/tahun lalu, serta timestamp ISO yang dibaca sebagai waktu lokal. Tanggal "sekarang" dibuat tetap supaya hasilnya tidak berubah tiap hari. |
| `npm run check:debts` | `searchDebts` (case-insensitive, spasi berlebih diabaikan), `sortDebts` untuk keempat urutan dan memastikan array asli tidak diubah, serta `groupByPerson` (nama "Budi", "budi ", "BUDI" jadi satu grup dengan total yang benar). |

Keduanya memakai `node:assert` tanpa test runner, dan gagal dengan exit code 1 kalau ada hasil yang tidak sesuai.

## Keputusan atas hal yang ambigu di spec

- **Field "Tanggal" di form disimpan ke `due_date`**, karena itu satu-satunya kolom tanggal di skema yang bisa diisi user. Tanggal relatif di list memakai `due_date` ("Jatuh tempo kemarin"). Kalau kosong, dipakai `created_at` ("Dicatat 3 hari lalu").
- **Summary hanya menghitung entry yang belum lunas** dan tidak terpengaruh filter maupun search. Angka di card tetap sama saat filter diganti.
- **"Tandai lunas" idempotent**: `settled_at` hanya diisi kalau masih `null`, jadi kalau request terkirim dua kali (double tap atau retry), waktu lunas pertama tidak tertimpa. Status lunas bisa dibatalkan lewat tombol "Batalin lunas".
- **Net = 0 berwarna netral** (abu-abu) dengan teks "Impas, aman", karena tidak positif maupun negatif.
- **Tanggal relatif dibuat sendiri**, tidak memakai `Intl.RelativeTimeFormat`, karena dengan locale `id` hasilnya "3 hari yang lalu", sedangkan spec meminta "3 hari lalu". Tanggal `YYYY-MM-DD` dibaca sebagai tanggal lokal supaya tidak bergeser sehari karena zona waktu.

## Approach

Keamanan data saya taruh di level database, bukan hanya di kode aplikasi. Pemisahan data antar user dijaga oleh RLS di Postgres, sehingga walaupun ada bug di route handler atau ada orang yang memanggil REST API Supabase langsung dengan publishable key, user tetap tidak bisa membaca atau mengubah data user lain. Hal ini saya buktikan dengan `test:rls` yang menyerang API secara langsung. Di sisi aplikasi, validasi input memakai satu schema zod yang sama di form dan di API. Form memberi feedback cepat ke user, sedangkan API tetap memvalidasi ulang karena request bisa dikirim tanpa lewat form. Constraint di database (`check`, `not null`) menjadi lapisan terakhir. Untuk UI, saya memilih komponen sederhana yang dibuat sendiri supaya setiap bagian bisa dijelaskan dan tidak bergantung pada library yang belum tentu dibutuhkan.

## Trade-off

Yang akan saya kerjakan kalau ada waktu 1 hari lagi:

- **Pagination list.** Sekarang list mengambil semua catatan dalam satu request, sehingga dibatasi 1000 baris oleh PostgREST. Untuk pemakaian pribadi ini cukup, tapi seharusnya pakai pagination atau infinite scroll dengan `range()`.
- **Optimistic update.** Setelah tandai lunas, edit, atau hapus, list menunggu refetch dari server baru berubah. Dengan optimistic update, UI langsung berubah dan di-rollback kalau request gagal.
- **Unit test dengan test runner.** `check:format` dan `check:debts` sekarang berupa script `node:assert`. Saya akan pindahkan ke Vitest supaya ada laporan per test, watch mode, dan bisa ditambah test untuk schema zod dan route handler.
- **E2E test alur utama** dengan Playwright: signup/login, catat baru, edit, tandai lunas, hapus, dan filter, dijalankan di viewport mobile dan desktop.

## Time spent

Sekitar 24 jam.
