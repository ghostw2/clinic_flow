# ClinicFlow

Appointment & Patient Tracking SaaS for small clinics.

## Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, FullCalendar |
| Backend  | Go 1.22, Gin, GORM                      |
| Database | PostgreSQL 16                           |
| Auth     | JWT (HS256) + bcrypt                    |
| Email    | Resend                                  |
| SMS      | Twilio (optional)                       |

## Project Structure

```
clinicflow/
├── frontend/        # Next.js 14 app
├── backend/         # Go + Gin API
├── db/              # SQL migration files
└── docker-compose.yml
```

## Quick Start (Docker)

```bash
# 1. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 2. Edit backend/.env with your values (DB, JWT secret, Resend key)

# 3. Start everything
docker compose up -d

# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Demo login: admin@democlinic.com / admin1234
```

## Local Development

### Backend

```bash
cd backend

# Install dependencies
go mod tidy

# Copy and fill in env
cp .env.example .env

# Run (requires Postgres running)
go run main.go
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.local.example .env.local

# Run dev server
npm run dev
```

### Database

Start Postgres and apply the migration:

```bash
docker run -d \
  -e POSTGRES_USER=clinicflow \
  -e POSTGRES_PASSWORD=clinicflow_secret \
  -e POSTGRES_DB=clinicflow \
  -p 5432:5432 \
  postgres:16-alpine

psql -U clinicflow -d clinicflow -f db/001_initial_schema.sql
```

## API Routes

| Method | Path                      | Auth   | Description              |
|--------|---------------------------|--------|--------------------------|
| POST   | /api/auth/login           | Public | Login, returns JWT       |
| POST   | /api/auth/logout          | Public | Client-side logout       |
| POST   | /api/auth/refresh         | JWT    | Refresh token            |
| GET    | /api/dashboard/stats      | JWT    | Dashboard stats          |
| GET    | /api/appointments         | JWT    | List appointments        |
| POST   | /api/appointments         | JWT    | Book appointment         |
| PUT    | /api/appointments/:id     | JWT    | Update appointment       |
| DELETE | /api/appointments/:id     | JWT    | Cancel appointment       |
| GET    | /api/patients             | JWT    | List patients            |
| GET    | /api/patients/:id         | JWT    | Patient + history        |
| POST   | /api/patients             | JWT    | Create patient           |
| PUT    | /api/patients/:id         | JWT    | Update patient           |
| DELETE | /api/patients/:id         | JWT    | Delete patient           |
| GET    | /api/users                | Admin  | List clinic users        |
| POST   | /api/users                | Admin  | Create user              |
| POST   | /api/notifications/send   | Staff+ | Send email/SMS reminder  |

## Roles

| Role   | Permissions                                     |
|--------|-------------------------------------------------|
| admin  | Full access to all resources                    |
| doctor | Own appointments, patients they've seen         |
| staff  | Manage appointments & patients, view users      |

## Pricing Plans

| Plan    | Price      | Doctors      | Patients   | Features           |
|---------|------------|--------------|------------|--------------------|
| Starter | $29/month  | 1            | Up to 100  | Email reminders    |
| Growth  | $59/month  | Up to 5      | Unlimited  | Email reminders    |
| Clinic  | $99/month  | Unlimited    | Unlimited  | SMS + Email, Priority support |

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=8080
DATABASE_URL=postgres://clinicflow:clinicflow_secret@localhost:5432/clinicflow?sslmode=disable
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY_HOURS=24
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=           # optional
TWILIO_AUTH_TOKEN=            # optional
TWILIO_PHONE_NUMBER=          # optional
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```
