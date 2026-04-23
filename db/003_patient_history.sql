-- Patient History: medical profile fields + medical_records table

-- Extend patients table with medical profile columns
ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS gender                  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS blood_type              VARCHAR(10),
    ADD COLUMN IF NOT EXISTS allergies               TEXT,
    ADD COLUMN IF NOT EXISTS chronic_conditions      TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_name  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS address                 TEXT,
    ADD COLUMN IF NOT EXISTS insurance               TEXT,
    ADD COLUMN IF NOT EXISTS occupation              VARCHAR(255);

-- Medical records: one per visit, optionally linked to an appointment
CREATE TABLE IF NOT EXISTS medical_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_id       UUID NOT NULL REFERENCES users(id),
    visit_date      TIMESTAMPTZ NOT NULL,
    chief_complaint TEXT,
    diagnosis       TEXT,
    treatment       TEXT,
    prescriptions   TEXT,
    vital_signs     JSONB,
    follow_up_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient   ON medical_records(patient_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic    ON medical_records(clinic_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor    ON medical_records(doctor_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_medical_records_visit     ON medical_records(visit_date)  WHERE deleted_at IS NULL;
