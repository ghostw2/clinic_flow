-- 2FA columns for users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled  BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_verified BOOLEAN DEFAULT FALSE;

-- Pre-auth sessions for 2FA login flow
CREATE TABLE IF NOT EXISTS pre_auth_sessions (
    id          VARCHAR(36) PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_auth_sessions_expires_at ON pre_auth_sessions(expires_at);
