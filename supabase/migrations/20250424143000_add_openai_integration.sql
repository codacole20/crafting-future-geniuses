
-- Add a passions column to the Crafting Tomorrow Users table
ALTER TABLE "Crafting Tomorrow Users" ADD COLUMN IF NOT EXISTS passions TEXT[] DEFAULT '{}';

-- Modify the lessons table to add user_id and description columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;

-- Create an index on the user_id column for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons(user_id);
