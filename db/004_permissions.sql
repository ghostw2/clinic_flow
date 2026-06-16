-- Add permissions column to clinics and seed defaults for all existing clinics

ALTER TABLE clinics
    ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}';

-- Seed default permissions for any clinic that has none set yet.
-- Doctor: full clinical access except deleting appointments/patients.
-- Staff:  scheduling and patient registration only.
UPDATE clinics
SET permissions = '{
  "doctor": [
    "appointment.create",
    "appointment.update",
    "appointment.update_status",
    "patient.create",
    "patient.update",
    "record.create",
    "record.update",
    "record.delete",
    "document.upload",
    "document.delete"
  ],
  "staff": [
    "appointment.create",
    "appointment.update_status",
    "patient.create",
    "patient.update",
    "document.upload"
  ]
}'::jsonb
WHERE permissions = '{}'::jsonb OR permissions IS NULL;
