-- Create password reset codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);

-- Enable RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert codes (for forgot password)
CREATE POLICY "Allow insert password reset codes" ON password_reset_codes
  FOR INSERT WITH CHECK (true);

-- Policy to allow anyone to read their own codes
CREATE POLICY "Allow read own password reset codes" ON password_reset_codes
  FOR SELECT USING (true);

-- Policy to allow updating used status
CREATE POLICY "Allow update password reset codes" ON password_reset_codes
  FOR UPDATE USING (true);
