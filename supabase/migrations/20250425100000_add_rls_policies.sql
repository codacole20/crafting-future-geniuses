
-- Add policy to enable users to read their lessons
CREATE POLICY "Users can read their own lessons"
  ON lessons
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Add policy to enable authenticated users to update their profiles
ALTER TABLE "Crafting Tomorrow Users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable authenticated users to update own profile"
  ON "Crafting Tomorrow Users"
  FOR ALL
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);
