-- Treatment courses and patient payment plans

CREATE TABLE IF NOT EXISTS treatments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by     UUID NOT NULL REFERENCES users(id),
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    total_amount   NUMERIC(10,2) NOT NULL,
    planned_visits INT NOT NULL DEFAULT 1,
    status         VARCHAR(50) NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'completed', 'cancelled')),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS treatment_payments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id  UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    amount        NUMERIC(10,2) NOT NULL,
    due_date      DATE,
    paid_at       TIMESTAMPTZ,
    status        VARCHAR(50) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'overdue')),
    notes         TEXT,
    recorded_by   UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link appointments to a treatment course (optional)
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS treatment_id UUID
        REFERENCES treatments(id) ON DELETE SET NULL;

-- Add new permission strings to existing clinics that already have permissions configured
UPDATE clinics
SET permissions = jsonb_set(
    jsonb_set(
        permissions,
        '{doctor}',
        COALESCE(permissions->'doctor', '[]'::jsonb) || '["treatment.create","treatment.update","payment.record"]'::jsonb
    ),
    '{staff}',
    COALESCE(permissions->'staff', '[]'::jsonb) || '["treatment.create","payment.record"]'::jsonb
)
WHERE permissions != '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_treatments_clinic_id   ON treatments(clinic_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id  ON treatments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_payments_tid ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tid       ON appointments(treatment_id) WHERE deleted_at IS NULL;
