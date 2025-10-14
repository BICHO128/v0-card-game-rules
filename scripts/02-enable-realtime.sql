-- Nuevo script para habilitar Realtime en las tablas

-- Habilitar Realtime para la tabla game_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;

-- Habilitar Realtime para la tabla game_players
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;

-- Habilitar Realtime para la tabla cards_in_play
ALTER PUBLICATION supabase_realtime ADD TABLE cards_in_play;

-- Verificar que las tablas estén en la publicación
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
