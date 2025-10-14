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
