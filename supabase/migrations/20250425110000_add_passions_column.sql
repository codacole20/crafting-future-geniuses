
-- If passions column doesn't exist yet, add it to the Crafting Tomorrow Users table
ALTER TABLE "Crafting Tomorrow Users" 
ADD COLUMN IF NOT EXISTS passions TEXT[] DEFAULT '{}';

-- Ensure RLS policy exists to allow users to update their own passions
CREATE POLICY IF NOT EXISTS "Users can update their own data" 
ON "Crafting Tomorrow Users" 
FOR UPDATE 
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);
