# Onboarding Feature - Username Setup

## Overview

Fitur onboarding ini memungkinkan user untuk membuat username unik setelah mendaftar/login. Username ini akan digunakan sebagai profile link mereka.

## Komponen yang Dibuat

### 1. Database Schema (`src/db/schema.ts`)

- Menambahkan field `username` (unique, nullable) ke tabel `user`

### 2. OnboardingDialog Component (`src/components/OnboardingDialog.tsx`)

- Dialog modal untuk input username
- Validasi:
  - Minimal 3 karakter
  - Maksimal 30 karakter
  - Hanya huruf, angka, underscore (\_), dan dash (-)
- Preview link: `@username`

### 3. Onboarding Route (`src/routes/onboarding.tsx`)

- Route `/onboarding` untuk halaman onboarding
- Redirect logic:
  - Jika belum login → redirect ke home
  - Jika sudah punya username → redirect ke home

### 4. TRPC Router (`src/integrations/trpc/router.ts`)

- Endpoint `user.updateUsername` untuk update username
- Validasi username sudah digunakan atau belum

### 5. Auth Configuration (`src/lib/auth.ts`)

- Menambahkan `username` ke `additionalFields` di better-auth

### 6. Index Route (`src/routes/index.tsx`)

- Auto-redirect ke `/onboarding` jika user login tapi belum punya username

## Cara Menggunakan

### 1. Jalankan Migration Database

Migration sudah di-generate. Untuk apply ke database:

```bash
bun run db:push
```

Ketika ditanya tentang unique constraint, pilih **"No, add the constraint without truncating the table"**.

### 2. Jalankan Development Server

```bash
bun run dev
```

### 3. Flow User

1. User login/register melalui Google atau email
2. Setelah login, jika belum punya username, otomatis redirect ke `/onboarding`
3. User mengisi username (contoh: `johndoe`)
4. Setelah submit, username tersimpan dan user redirect ke home
5. Profile link user: `/@johndoe`

## Validasi Username

- **Minimal**: 3 karakter
- **Maksimal**: 30 karakter
- **Karakter yang diperbolehkan**: huruf (a-z, A-Z), angka (0-9), underscore (\_), dash (-)
- **Unique**: Tidak boleh sama dengan username user lain
- **Auto-lowercase**: Input otomatis diubah ke lowercase

## Error Handling

- Username sudah digunakan → Error: "Username sudah digunakan"
- Username tidak valid → Error sesuai validasi
- User tidak ditemukan → Error: "User tidak ditemukan"

## File Migration

Migration file: `drizzle/0002_worried_black_bolt.sql`

Isi migration:

```sql
ALTER TABLE "user" ADD COLUMN "username" text;
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");
```

## Testing

1. Login dengan akun baru
2. Pastikan redirect ke `/onboarding`
3. Coba input username yang tidak valid (kurang dari 3 karakter)
4. Coba input username yang valid
5. Pastikan redirect ke home setelah berhasil
6. Coba login lagi, pastikan tidak redirect ke onboarding lagi

## Future Improvements

- [ ] Tambahkan profile page di `/@username`
- [ ] Tambahkan edit username feature
- [ ] Tambahkan username availability checker (real-time)
- [ ] Tambahkan username suggestions
