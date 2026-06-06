CREATE TABLE IF NOT EXISTS game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  difficulty text NOT NULL DEFAULT 'সহজ',
  game_type text NOT NULL DEFAULT 'color_memory',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_game_scores" ON game_scores FOR SELECT
  TO anon USING (true);

CREATE POLICY "insert_game_scores" ON game_scores FOR INSERT
  TO anon WITH CHECK (true);
