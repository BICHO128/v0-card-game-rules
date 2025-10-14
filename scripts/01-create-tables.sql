-- Tabla para las salas de juego
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'lobby',
  current_turn_player_id TEXT,
  selected_attribute TEXT,
  start_time BIGINT,
  winner_id TEXT,
  game_end_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para los jugadores
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES game_rooms(code) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cards JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT TRUE,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_code, player_id)
);

-- Tabla para las cartas en juego
CREATE TABLE IF NOT EXISTS cards_in_play (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES game_rooms(code) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  card JSONB NOT NULL,
  is_tied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(code);
CREATE INDEX IF NOT EXISTS idx_game_players_room_code ON game_players(room_code);
CREATE INDEX IF NOT EXISTS idx_cards_in_play_room_code ON cards_in_play(room_code);

-- Habilitar Row Level Security
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards_in_play ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora para simplificar)
DROP POLICY IF EXISTS "Allow all operations on game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Allow all operations on game_players" ON game_players;
DROP POLICY IF EXISTS "Allow all operations on cards_in_play" ON cards_in_play;

CREATE POLICY "Allow all operations on game_rooms" ON game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on game_players" ON game_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cards_in_play" ON cards_in_play FOR ALL USING (true) WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_game_rooms_updated_at ON game_rooms;
CREATE TRIGGER update_game_rooms_updated_at
  BEFORE UPDATE ON game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
