# Approval System — Manajemen Klaim Asuransi

Technical Test · PT AQ Business Consulting Indonesia · 2025

---

## Gambaran Umum

Sistem manajemen klaim asuransi berbasis web dengan alur persetujuan bertingkat. Dibangun menggunakan **FastAPI** di sisi backend dan **Next.js TypeScript** di sisi frontend.

### Role Pengguna

| Role | Tanggung Jawab |
|------|----------------|
| User | Membuat dan mengajukan klaim asuransi |
| Verifier | Memeriksa klaim yang diajukan dan menandainya sebagai reviewed |
| Approver | Mengambil keputusan akhir — menyetujui atau menolak klaim |

### Alur Status Klaim

```
draft → submitted → reviewed → approved / rejected
  ↑User    ↑Verifier    ↑Approver
```

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy, PyMySQL |
| Frontend | TypeScript, Next.js 15, Tailwind CSS, shadcn/ui |
| State Management | Zustand |
| Database | MySQL 8.0 |
| Autentikasi | JWT (python-jose + passlib bcrypt) |
| Deployment | Docker, Docker Compose |

---

## Struktur Project

```
.
├── backend/
│   ├── app/
│   │   ├── core/              # Konfigurasi, database, keamanan, dan dependensi auth
│   │   │   ├── config.py      # Pydantic settings
│   │   │   ├── database.py    # SQLAlchemy engine dan session
│   │   │   ├── security.py    # Utilitas JWT dan bcrypt
│   │   │   └── deps.py        # Auth middleware dan RBAC
│   │   ├── models/            # Model ORM SQLAlchemy
│   │   │   ├── user.py        # Model User dengan enum role
│   │   │   ├── claim.py       # Model Claim dengan enum status
│   │   │   └── claim_log.py   # Model activity log
│   │   ├── schemas/           # Pydantic schema untuk request dan response
│   │   ├── repositories/      # Layer akses data
│   │   │   ├── user_repo.py
│   │   │   └── claim_repo.py  # Termasuk SELECT FOR UPDATE untuk mencegah race condition
│   │   ├── services/          # Business logic
│   │   │   ├── auth_service.py
│   │   │   └── claim_service.py  # Validasi transisi status
│   │   ├── routers/           # Handler endpoint API
│   │   │   ├── auth.py        # /api/auth/*
│   │   │   └── claims.py      # /api/claims/*
│   │   └── main.py
│   ├── seed.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   └── dashboard/
│   │       ├── claims/        # Dashboard User
│   │       ├── verify/        # Dashboard Verifier
│   │       └── approve/       # Dashboard Approver
│   ├── components/
│   │   ├── navbar.tsx
│   │   └── status-badge.tsx
│   ├── lib/
│   │   ├── api.ts             # Axios instance dengan JWT interceptor
│   │   └── utils.ts           # Format mata uang dan tanggal
│   ├── store/
│   │   └── auth.ts            # Zustand auth store
│   ├── types/
│   │   └── index.ts
│   └── Dockerfile
└── docker-compose.yml
```

### Arsitektur dan Design Pattern

Backend menggunakan arsitektur berlapis:

- **Repository Pattern** — query database diisolasi di layer `repositories/`, sehingga business logic tetap bersih dan tidak bergantung langsung ke database
- **Service Layer** — semua aturan bisnis dan validasi transisi status berada di `services/`
- **RBAC** — setiap endpoint dilindungi oleh dependensi `require_role()` yang memverifikasi role pengguna dari JWT token

---

## Cara Menjalankan

### Opsi A: Docker Compose (Direkomendasikan)

Pastikan Docker Desktop sudah berjalan sebelum memulai.

```bash
# Masuk ke folder project
cd "PT AQ Business Consulting Indonesia"

# Build dan jalankan semua service
docker-compose up --build

# Di terminal baru, seed database (tunggu backend siap terlebih dahulu)
docker exec -it assurance_backend python seed.py
```

Setelah semua berjalan:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

```bash
# Menghentikan semua service
docker-compose down

# Menghentikan dan menghapus volume database
docker-compose down -v
```

---

### Opsi B: Local Development

Kebutuhan: Python 3.12, Node.js 20+, MySQL 8.0

**Backend:**

```bash
cd backend

python3.12 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

# Buat database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS assurance_db;"

# Seed akun dummy
python seed.py

# Jalankan server
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend

npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

---

## Akun Demo

| Email | Password | Role |
|-------|----------|------|
| user@demo.com | password123 | User |
| verifier@demo.com | password123 | Verifier |
| approver@demo.com | password123 | Approver |

---

## Dokumentasi API

### Auth

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/register` | Registrasi akun baru |
| POST | `/api/auth/login` | Login dan mendapatkan JWT token |

### Claims

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| POST | `/api/claims` | User | Membuat klaim baru |
| GET | `/api/claims/my` | User | Melihat daftar klaim milik sendiri |
| POST | `/api/claims/{id}/submit` | User | Mengajukan klaim draft |
| GET | `/api/claims/submitted` | Verifier | Melihat klaim yang sudah diajukan |
| POST | `/api/claims/{id}/review` | Verifier | Menandai klaim sebagai reviewed |
| GET | `/api/claims/reviewed` | Approver | Melihat klaim yang sudah direview |
| POST | `/api/claims/{id}/approve` | Approver | Menyetujui klaim |
| POST | `/api/claims/{id}/reject` | Approver | Menolak klaim |
| GET | `/api/claims/{id}/logs` | Semua role | Melihat activity log klaim |

Dokumentasi lengkap dan interaktif tersedia di http://localhost:8000/docs melalui Swagger UI.

---

## Catatan Teknis

### Mencegah submit berulang (Frontend)

Setiap tombol aksi menggunakan boolean state (`submitting`, `processingId`) yang langsung di-set `true` begitu request dikirim. Tombol otomatis di-disable, dan guard di awal fungsi mencegah klik berikutnya memicu request kedua:

```tsx
const handleSubmit = async () => {
  if (submitting) return;
  setSubmitting(true);
  try {
    await api.post(...);
  } finally {
    setSubmitting(false);
  }
};
```

### Mencegah race condition (Backend)

Semua transisi status menggunakan `SELECT FOR UPDATE`, yang mengunci baris di level database. Jika dua request datang bersamaan, request kedua menunggu lock dilepas — pada saat itu status sudah berubah, dan request kedua langsung ditolak dengan error 400:

```python
select(Claim).where(Claim.id == claim_id).with_for_update()
```

---

## Skema Database

```
users
  id, name, email, password
  role: ENUM(user, verifier, approver)
  created_at

claims
  id, user_id → users.id
  title, description, amount
  status: ENUM(draft, submitted, reviewed, approved, rejected)
  created_at, updated_at

claim_logs
  id, claim_id → claims.id, user_id → users.id
  from_status, to_status, note
  created_at
```

---

## Environment Variables

**backend/.env**
```env
DATABASE_URL=mysql+pymysql://user:pass@host:3306/dbname
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```