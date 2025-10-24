-- Add is_photo column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_photo BOOLEAN DEFAULT FALSE;
