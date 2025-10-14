"use client"

import { create } from "zustand"
import type { GameCard, Player, GameState } from "./game-types"
import { distributeCards, determineFirstPlayer, compareCards, getNextPlayer, checkGameEnd } from "./game-logic"

type GameStore = {
  // Estado del juego
  roomCode: string
  players: Player[]
  gameState: GameState
  currentTurnPlayerId: string | null
  selectedAttribute: string | null
  cardsInPlay: { playerId: string; card: GameCard }[]
  tiedCards: { playerId: string; card: GameCard }[]
  startTime: number | null
  winnerId: string | null
  gameEndReason: string

  // Acciones
  initializeGame: (roomCode: string, playerNames: string[]) => void
  playCard: (playerId: string) => void
  selectAttribute: (playerId: string, attributeName: string) => void
  resolveRound: () => void
  nextTurn: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Estado inicial
  roomCode: "",
  players: [],
  gameState: "lobby",
  currentTurnPlayerId: null,
  selectedAttribute: null,
  cardsInPlay: [],
  tiedCards: [],
  startTime: null,
  winnerId: null,
  gameEndReason: "",

  // Inicializar el juego
  initializeGame: (roomCode: string, playerNames: string[]) => {
    const playerCards = distributeCards(playerNames.length)
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      cards: playerCards[index],
      isActive: false,
      isConnected: true,
    }))

    const firstPlayerId = determineFirstPlayer(players)
    players.find((p) => p.id === firstPlayerId)!.isActive = true

    set({
      roomCode,
      players,
      gameState: "playing",
      currentTurnPlayerId: firstPlayerId,
      startTime: Date.now(),
      cardsInPlay: [],
      tiedCards: [],
      selectedAttribute: null,
      winnerId: null,
      gameEndReason: "",
    })
  },

  // Jugar una carta
  playCard: (playerId: string) => {
    const { players, cardsInPlay } = get()
    const player = players.find((p) => p.id === playerId)

    if (!player || player.cards.length === 0) return

    const card = player.cards[0]
    set({
      cardsInPlay: [...cardsInPlay, { playerId, card }],
    })
  },

  // Seleccionar atributo
  selectAttribute: (playerId: string, attributeName: string) => {
    const { currentTurnPlayerId, players } = get()

    if (playerId !== currentTurnPlayerId) return

    // El jugador actual juega su carta
    get().playCard(playerId)

    // Los demás jugadores juegan sus cartas automáticamente
    players.forEach((player) => {
      if (player.id !== playerId && player.cards.length > 0) {
        get().playCard(player.id)
      }
    })

    set({ selectedAttribute: attributeName })

    // Resolver la ronda después de un pequeño delay
    setTimeout(() => {
      get().resolveRound()
    }, 1500)
  },

  // Resolver la ronda
  resolveRound: () => {
    const { cardsInPlay, selectedAttribute, tiedCards, players, startTime } = get()

    if (!selectedAttribute || cardsInPlay.length === 0) return

    // Comparar las cartas
    const { winnerId, isTie } = compareCards(cardsInPlay, selectedAttribute)

    if (isTie) {
      // Empate: acumular cartas y jugar otra ronda
      set({
        tiedCards: [...tiedCards, ...cardsInPlay],
        cardsInPlay: [],
        selectedAttribute: null,
      })

      // El mismo jugador elige de nuevo
      setTimeout(() => {
        // Aquí el jugador debe elegir otro atributo
      }, 1000)
    } else if (winnerId) {
      // Hay un ganador
      const winner = players.find((p) => p.id === winnerId)
      if (!winner) return

      // Remover las cartas jugadas de los jugadores
      const updatedPlayers = players.map((player) => {
        const playedCard = cardsInPlay.find((c) => c.playerId === player.id)
        if (playedCard) {
          return {
            ...player,
            cards: player.cards.filter((c) => c.id !== playedCard.card.id),
          }
        }
        return player
      })

      // Agregar todas las cartas al ganador
      const allWonCards = [...cardsInPlay.map((c) => c.card), ...tiedCards.map((c) => c.card)]

      const finalPlayers = updatedPlayers.map((player) => {
        if (player.id === winnerId) {
          return {
            ...player,
            cards: [...player.cards, ...allWonCards],
            isActive: true,
          }
        }
        return { ...player, isActive: false }
      })

      // Verificar si el juego terminó
      const gameEnd = checkGameEnd(finalPlayers, startTime)

      if (gameEnd.isEnded) {
        set({
          players: finalPlayers,
          gameState: "finished",
          winnerId: gameEnd.winnerId,
          gameEndReason: gameEnd.reason,
          cardsInPlay: [],
          tiedCards: [],
          selectedAttribute: null,
        })
      } else {
        // Continuar al siguiente turno
        set({
          players: finalPlayers,
          currentTurnPlayerId: winnerId,
          cardsInPlay: [],
          tiedCards: [],
          selectedAttribute: null,
        })
      }
    }
  },

  // Siguiente turno
  nextTurn: () => {
    const { players, currentTurnPlayerId } = get()
    if (!currentTurnPlayerId) return

    const nextPlayerId = getNextPlayer(players, currentTurnPlayerId)
    const updatedPlayers = players.map((p) => ({
      ...p,
      isActive: p.id === nextPlayerId,
    }))

    set({
      players: updatedPlayers,
      currentTurnPlayerId: nextPlayerId,
    })
  },

  // Reiniciar el juego
  resetGame: () => {
    set({
      roomCode: "",
      players: [],
      gameState: "lobby",
      currentTurnPlayerId: null,
      selectedAttribute: null,
      cardsInPlay: [],
      tiedCards: [],
      startTime: null,
      winnerId: null,
      gameEndReason: "",
    })
  },
}))
