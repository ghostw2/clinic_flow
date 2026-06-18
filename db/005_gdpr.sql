-- GDPR compliance: consent tracking + audit log

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_notes    TEXT;

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID         NOT NULL,
  user_id       UUID         NOT NULL,
  user_name     VARCHAR(255) NOT NULL,
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id   UUID         NOT NULL,
  details       JSONB,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic   ON audit_logs(clinic_id, created_at DESC);
