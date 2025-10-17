export type CardAttribute = {
  name: string
  value: number
}

export type GameCard = {
  id: string
  name: string
  image: string
  attributes: CardAttribute[]
  category: string
}

export type Player = {
  id: string
  name: string
  cards: GameCard[]
  isActive: boolean
  isConnected: boolean
  isHost: boolean
}

export type GameState = "lobby" | "playing" | "finished"

export type BattleResult = {
  winnerId: string | null
  isTie: boolean
  cardsInPlay: { playerId: string; card: GameCard }[]
}

export type GameRoom = {
  code: string
  players: Player[]
  state: GameState
  currentTurnPlayerId: string | null
  selectedAttribute: string | null
  cardsInPlay: { playerId: string; card: GameCard }[]
  tiedCards: { playerId: string; card: GameCard }[]
  startTime: number | null
  theme: string
}

export type DatabaseGameRoom = {
  id: string
  code: string
  state: string
  current_turn_player_id: string | null
  selected_attribute: string | null
  start_time: number | null
  winner_id: string | null
  game_end_reason: string | null
  created_at: string
  updated_at: string
}

export type DatabasePlayer = {
  id: string
  room_code: string
  player_id: string
  name: string
  cards: GameCard[]
  is_active: boolean
  is_connected: boolean
  is_host: boolean
  joined_at: string
}

export type DatabaseCardInPlay = {
  id: string
  room_code: string
  player_id: string
  card: GameCard
  is_tied: boolean
  created_at: string
}

export type ChatMessage = {
  id: string
  roomCode: string
  playerId: string
  playerName: string
  message: string
  createdAt: string
}

export type DatabaseChatMessage = {
  id: string
  room_code: string
  player_id: string
  player_name: string
  message: string
  created_at: string
}
