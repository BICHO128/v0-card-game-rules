import type { GameCard, Player } from "./game-types"
import { POKEMON_CARDS } from "./card-data"

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function shuffleCards(cards: GameCard[]): GameCard[] {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function distributeCards(playerCount: number): GameCard[][] {
  const shuffled = shuffleCards(POKEMON_CARDS)
  const cardsPerPlayer = Math.floor(shuffled.length / playerCount)
  const playerCards: GameCard[][] = []

  for (let i = 0; i < playerCount; i++) {
    playerCards.push(shuffled.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer))
  }

  // Distribuir cartas sobrantes aleatoriamente
  const remainingCards = shuffled.slice(playerCount * cardsPerPlayer)
  remainingCards.forEach((card, index) => {
    playerCards[index % playerCount].push(card)
  })

  return playerCards
}

export function determineFirstPlayer(players: Player[]): string {
  const priorityOrder = ["1A", "1B", "1C", "1D", "2A", "2B", "2C", "2D"]

  for (const cardId of priorityOrder) {
    const player = players.find((p) => p.cards.some((card) => card.id === cardId))
    if (player) return player.id
  }

  return players[0].id
}

export function compareCards(
  cardsInPlay: { playerId: string; card: GameCard }[],
  attributeName: string,
): { winnerId: string | null; isTie: boolean } {
  let maxValue = -1
  let winnerId: string | null = null
  let tieCount = 0

  cardsInPlay.forEach(({ playerId, card }) => {
    const attr = card.attributes.find((a) => a.name === attributeName)
    const value = attr?.value ?? 0

    if (value > maxValue) {
      maxValue = value
      winnerId = playerId
      tieCount = 1
    } else if (value === maxValue) {
      tieCount++
    }
  })

  return {
    winnerId: tieCount > 1 ? null : winnerId,
    isTie: tieCount > 1,
  }
}

export function getNextPlayer(players: Player[], currentPlayerId: string): string {
  const activePlayers = players.filter((p) => p.cards.length > 0)
  const currentIndex = activePlayers.findIndex((p) => p.id === currentPlayerId)
  const nextIndex = (currentIndex + 1) % activePlayers.length
  return activePlayers[nextIndex].id
}

export function checkGameEnd(
  players: Player[],
  startTime: number | null,
): { isEnded: boolean; winnerId: string | null; reason: string } {
  // Un jugador tiene todas las cartas
  const playerWithAllCards = players.find((p) => p.cards.length === POKEMON_CARDS.length)
  if (playerWithAllCards) {
    return {
      isEnded: true,
      winnerId: playerWithAllCards.id,
      reason: "all-cards",
    }
  }

  // Solo queda un jugador con cartas
  const playersWithCards = players.filter((p) => p.cards.length > 0)
  if (playersWithCards.length === 1) {
    return {
      isEnded: true,
      winnerId: playersWithCards[0].id,
      reason: "last-standing",
    }
  }

  // Han pasado 30 minutos
  if (startTime && Date.now() - startTime > 30 * 60 * 1000) {
    let maxCards = 0
    let winnerId: string | null = null
    let tieCount = 0

    players.forEach((player) => {
      if (player.cards.length > maxCards) {
        maxCards = player.cards.length
        winnerId = player.id
        tieCount = 1
      } else if (player.cards.length === maxCards) {
        tieCount++
      }
    })

    return {
      isEnded: true,
      winnerId: tieCount > 1 ? null : winnerId,
      reason: "timeout",
    }
  }

  return { isEnded: false, winnerId: null, reason: "" }
}
