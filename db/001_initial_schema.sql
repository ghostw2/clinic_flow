-- ClinicFlow Initial Schema
-- Run: psql -U clinicflow -d clinicflow -f 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clinics
CREATE TABLE IF NOT EXISTS clinics (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    address     TEXT,
    phone       VARCHAR(50),
    email       VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Users (belongs to a clinic)
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    role          VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','doctor','staff')),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    UNIQUE (email, clinic_id)
);

-- Patients (belongs to a clinic)
CREATE TABLE IF NOT EXISTS patients (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    dob         DATE,
    phone       VARCHAR(50),
    email       VARCHAR(255),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id   UUID NOT NULL REFERENCES users(id),
    datetime    TIMESTAMPTZ NOT NULL,
    duration    INT NOT NULL DEFAULT 30, -- minutes
    status      VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL CHECK (type IN ('email','sms')),
    sent_at         TIMESTAMPTZ,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_clinic_id       ON users(clinic_id)       WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_clinic_id    ON patients(clinic_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_clinic   ON appointments(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_doctor   ON appointments(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_patient  ON appointments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_datetime ON appointments(datetime)   WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_appt    ON notifications(appointment_id);

-- Seed: demo clinic + admin user (password: admin1234)
INSERT INTO clinics (id, name, address, phone, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Demo Clinic',
    '123 Health Street, Medical City, CA 90210',
    '+1-555-0100',
    'contact@democlinic.com'
) ON CONFLICT DO NOTHING;

INSERT INTO users (id, clinic_id, role, name, email, password_hash)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    'Admin User',
    'admin@democlinic.com',
    '$2a$10$gZz6qAmAoSx0JxoykrAg..6VEclHw4F.8F389C.grBuQ6nMQ01NYC' -- admin1234
) ON CONFLICT DO NOTHING;
