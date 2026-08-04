# 🏠 Property Listing Management System — Setup Guide

Panduan lengkap untuk setup sistem dari awal hingga siap digunakan.

---

## Prerequisites

- [Node.js](https://nodejs.org/) versi 20+ terinstall
- Akun [Supabase](https://supabase.com/) (Free tier)
- Akun [Google Cloud Console](https://console.cloud.google.com/)
- Akun [Telegram](https://telegram.org/)
- Akun [Groq](https://console.groq.com/) untuk AI API (Free, tanpa kartu kredit)
- Akun [Vercel](https://vercel.com/) untuk deployment (Free tier)
- Akun [GitHub](https://github.com/) untuk repository

---

## Step 1: Buat Telegram Bot 🤖

1. Buka Telegram, cari **@BotFather**
2. Kirim pesan `/newbot`
3. Ikuti instruksi:
   - Beri nama bot (contoh: `Property Hub Bot`)
   - Beri username bot (contoh: `propertyhub_bot`) — harus unik & diakhiri `bot`
4. **Catat Bot Token** yang diberikan BotFather (format: `123456:ABC-DEF1234...`)
5. ⚠️ **Jangan share token ini ke siapa pun!**

### Dapatkan Telegram User ID

Untuk fitur whitelist, Anda perlu Telegram User ID:

1. Cari bot **@userinfobot** di Telegram
2. Kirim `/start` atau pesan apapun
3. Bot akan membalas dengan **User ID** Anda (angka, contoh: `987654321`)
4. Catat User ID untuk semua agent yang akan menggunakan bot

---

## Step 2: Setup Supabase 🗄️

1. Buat project baru di [supabase.com](https://supabase.com/dashboard)
2. Pilih region terdekat (Singapore untuk Indonesia)
3. Catat:
   - **Project URL**: `https://xxxxx.supabase.co` (Settings → API)
   - **Anon Key**: public key (Settings → API → `anon` `public`)
   - **Service Role Key**: secret key (Settings → API → `service_role` `secret`) — ⚠️ RAHASIA!

### Jalankan SQL Schema

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy-paste seluruh isi file `supabase-schema.sql`
3. Klik **Run**
4. Verifikasi: 3 tabel (`listings`, `allowed_users`, `allowed_telegram_users`) muncul di Table Editor

### Tambahkan User Pertama

Jalankan SQL berikut di SQL Editor (ganti dengan data Anda):

```sql
-- Tambahkan admin pertama (email Google Anda)
INSERT INTO allowed_users (email, role)
VALUES ('email-anda@gmail.com', 'admin');

-- Tambahkan Telegram user yang diizinkan
INSERT INTO allowed_telegram_users (telegram_user_id, name)
VALUES ('987654321', 'Nama Agen Anda');
```

---

## Step 3: Setup Google OAuth 🔐

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat Project baru atau pilih yang sudah ada
3. Aktifkan **OAuth consent screen**:
   - User Type: **External**
   - Isi App name, Support email
   - Tambahkan scope: `email`, `profile`, `openid`
   - Publish app

4. Buat **OAuth 2.0 Client ID**:
   - Navigasi: APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://your-app.vercel.app
     ```
   - Authorized redirect URIs:
     ```
     https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
     ```
     (dapatkan URL ini dari Supabase Dashboard → Authentication → Providers → Google)
   - Klik **Create**

5. **Catat Client ID** dan **Client Secret**

6. Masukkan ke Supabase:
   - Supabase Dashboard → Authentication → Providers → Google
   - Toggle **Enabled** → ON
   - Paste **Client ID** dan **Client Secret**
   - Save

---

## Step 4: Dapatkan Groq API Key 🧠

1. Kunjungi [Groq Console](https://console.groq.com/)
2. Sign up dengan Google atau GitHub (gratis, **tanpa kartu kredit**)
3. Buka menu **API Keys** di sidebar
4. Klik **Create API Key**
5. **Catat API Key** yang dihasilkan (format: `gsk_...`)

> ℹ️ Free tier Groq: 30 request/menit, 14.400 request/hari — lebih dari cukup untuk bot Telegram.

---

## Step 5: Setup Environment Variables ⚙️

Buat file `.env.local` di root project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq AI
GROQ_API_KEY=gsk_...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_WEBHOOK_SECRET=random-secret-string-32-chars-min

# App URL (update after Vercel deployment)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generate Webhook Secret

Jalankan di terminal untuk generate random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 6: Install & Run Locally 🚀

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Step 7: Deploy ke Vercel 🌐

1. Push code ke GitHub repository
2. Buka [Vercel Dashboard](https://vercel.com/dashboard)
3. Klik **Add New Project** → Import dari GitHub
4. Set **Environment Variables** di Vercel:
   - Masukkan semua variable dari `.env.local`
   - **Penting:** Update `NEXT_PUBLIC_APP_URL` ke URL Vercel Anda (contoh: `https://property-hub.vercel.app`)
5. Deploy!

### Update Google OAuth Redirect

Setelah deploy, tambahkan URL produksi ke Google Cloud Console:
- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs tetap yang Supabase (tidak berubah)

---

## Step 8: Aktivasi Webhook Telegram 📡

**Ini adalah langkah terakhir dan WAJIB dilakukan setelah deploy ke Vercel.**

### Cara 1: Via Browser (Mudah)

Buka URL ini di browser:
```
https://your-app.vercel.app/api/telegram/set-webhook
```

Jika berhasil, Anda akan melihat response:
```json
{
  "success": true,
  "message": "Webhook set successfully"
}
```

### Cara 2: Via cURL (Manual)

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/telegram",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

### Verifikasi Webhook

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

---

## Step 9: Test Bot! ✅

1. Buka Telegram → cari bot Anda
2. Kirim `/start` → bot akan menyambut dan memberi panduan
3. **Test pencarian:**
   ```
   Cari rumah di Gading Serpong harga di bawah 1 M
   ```
4. **Test template parsing** — paste template seperti:
   ```
   DIJUAL RUMAH
   Kawasan: Gading Serpong
   Alamat: Jl. Mawar No. 12
   LT: 90 m2
   LB: 60 m2
   KT: 3
   KM: 2
   Harga: 850 Juta (Nego)
   Ket: Siap huni, SHM
   ```

---

## Troubleshooting 🔧

### Bot tidak merespon
- Cek webhook sudah terdaftar: `getWebhookInfo`
- Cek Telegram User ID sudah ada di `allowed_telegram_users`
- Cek Vercel logs untuk error

### Login Google gagal
- Pastikan redirect URI di Google Cloud Console tepat
- Pastikan email sudah ada di `allowed_users`
- Cek Supabase Auth logs

### Data tidak muncul
- Pastikan RLS policies sudah di-run
- Cek apakah user email ada di `allowed_users`

---

## 📋 Checklist Setup

- [ ] Telegram Bot dibuat via @BotFather
- [ ] Telegram User ID dicatat
- [ ] Supabase project dibuat
- [ ] SQL schema di-run
- [ ] Admin user ditambahkan ke `allowed_users`
- [ ] Telegram user ditambahkan ke `allowed_telegram_users`
- [ ] Google OAuth dikonfigurasi
- [ ] Groq API Key didapat
- [ ] `.env.local` diisi lengkap
- [ ] Deploy ke Vercel
- [ ] Webhook Telegram diaktifkan
- [ ] Bot berhasil merespon
