-- Add file support columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT; -- 'image', 'video', 'document', 'audio'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;
