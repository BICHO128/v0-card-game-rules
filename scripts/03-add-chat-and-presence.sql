-- Tabla para mensajes de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES game_rooms(code) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por sala
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_code ON chat_messages(room_code);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Habilitar Realtime para chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Agregar columna para rastrear última actividad del jugador
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ DEFAULT NOW();

-- Función para actualizar heartbeat
CREATE OR REPLACE FUNCTION update_player_heartbeat(p_room_code TEXT, p_player_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE game_players
  SET last_heartbeat = NOW(), is_connected = true
  WHERE room_code = p_room_code AND player_id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar jugadores desconectados (más de 10 segundos sin heartbeat)
CREATE OR REPLACE FUNCTION mark_disconnected_players()
RETURNS void AS $$
BEGIN
  UPDATE game_players
  SET is_connected = false
  WHERE last_heartbeat < NOW() - INTERVAL '10 seconds'
    AND is_connected = true;
END;
$$ LANGUAGE plpgsql;
