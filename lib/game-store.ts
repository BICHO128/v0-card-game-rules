"use client"

import { create } from "zustand"
import type { GameCard, Player, GameState, ChatMessage } from "./game-types"
import { distributeCards, determineFirstPlayer, compareCards, checkGameEnd } from "./game-logic"
import { getSupabaseClient } from "./supabase-client"
import type { RealtimeChannel } from "@supabase/supabase-js"

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
  currentPlayerId: string | null
  realtimeChannel: RealtimeChannel | null
  chatMessages: ChatMessage[]
  isHostDisconnected: boolean

  // Acciones
  setCurrentPlayerId: (playerId: string) => void
  createRoom: (roomCode: string, playerName: string) => Promise<void>
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>
  subscribeToRoom: (roomCode: string) => void
  unsubscribeFromRoom: () => void
  startGame: () => Promise<void>
  playCard: (playerId: string) => void
  selectAttribute: (playerId: string, attributeName: string) => Promise<void>
  resolveRound: () => Promise<void>
  resetGame: () => void
  sendChatMessage: (message: string) => Promise<void>
  startHeartbeat: () => void
  stopHeartbeat: () => void
  leaveRoom: () => Promise<void>
}

let heartbeatInterval: NodeJS.Timeout | null = null

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
  currentPlayerId: null,
  realtimeChannel: null,
  chatMessages: [],
  isHostDisconnected: false,

  setCurrentPlayerId: (playerId: string) => {
    set({ currentPlayerId: playerId })
  },

  createRoom: async (roomCode: string, playerName: string) => {
    const supabase = getSupabaseClient()
    const playerId = `player-${Math.random().toString(36).substr(2, 9)}`

    // Crear la sala
    const { error: roomError } = await supabase.from("game_rooms").insert({
      code: roomCode,
      state: "lobby",
    })

    if (roomError) {
      console.error("[v0] Error creating room:", roomError)
      throw roomError
    }

    // Agregar el jugador como anfitrión
    const { error: playerError } = await supabase.from("game_players").insert({
      room_code: roomCode,
      player_id: playerId,
      name: playerName,
      is_host: true,
      is_connected: true,
    })

    if (playerError) {
      console.error("[v0] Error adding player:", playerError)
      throw playerError
    }

    set({ roomCode, currentPlayerId: playerId })
    get().subscribeToRoom(roomCode)
    get().startHeartbeat()
  },

  joinRoom: async (roomCode: string, playerName: string) => {
    const supabase = getSupabaseClient()
    const playerId = `player-${Math.random().toString(36).substr(2, 9)}`

    // Verificar que la sala existe
    const { data: room, error: roomError } = await supabase.from("game_rooms").select("*").eq("code", roomCode).single()

    if (roomError || !room) {
      console.error("[v0] Room not found:", roomError)
      return false
    }

    // Verificar que no haya más de 4 jugadores
    const { data: existingPlayers } = await supabase.from("game_players").select("*").eq("room_code", roomCode)

    if (existingPlayers && existingPlayers.length >= 4) {
      console.error("[v0] Room is full")
      return false
    }

    // Agregar el jugador
    const { error: playerError } = await supabase.from("game_players").insert({
      room_code: roomCode,
      player_id: playerId,
      name: playerName,
      is_host: false,
      is_connected: true,
    })

    if (playerError) {
      console.error("[v0] Error joining room:", playerError)
      return false
    }

    set({ roomCode, currentPlayerId: playerId })
    get().subscribeToRoom(roomCode)
    get().startHeartbeat()
    return true
  },

  subscribeToRoom: (roomCode: string) => {
    const supabase = getSupabaseClient()

    console.log("[v0] Subscribing to room:", roomCode)

    // Cancelar suscripción anterior si existe
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      console.log("[v0] Removing previous channel")
      supabase.removeChannel(realtimeChannel)
    }

    // Crear nueva suscripción
    const channel = supabase
      .channel(`room:${roomCode}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          console.log("[v0] Players changed:", payload)
          // Recargar jugadores cuando hay cambios
          loadPlayers(roomCode)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          console.log("[v0] Room state changed:", payload)
          // Recargar estado del juego cuando hay cambios
          loadGameState(roomCode)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards_in_play",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          console.log("[v0] Cards in play changed:", payload)
          // Recargar cartas en juego cuando hay cambios
          loadCardsInPlay(roomCode)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          console.log("[v0] New chat message:", payload)
          loadChatMessages(roomCode)
        },
      )
      .subscribe((status) => {
        console.log("[v0] Subscription status:", status)
      })

    set({ realtimeChannel: channel })

    // Cargar datos iniciales
    loadPlayers(roomCode)
    loadGameState(roomCode)
    loadCardsInPlay(roomCode)
    loadChatMessages(roomCode)

    // Función para cargar jugadores
    async function loadPlayers(code: string) {
      console.log("[v0] Loading players for room:", code)
      const { data: playersData, error } = await supabase
        .from("game_players")
        .select("*")
        .eq("room_code", code)
        .order("joined_at", { ascending: true })

      if (error) {
        console.error("[v0] Error loading players:", error)
        return
      }

      if (playersData) {
        console.log("[v0] Players loaded:", playersData)
        const players: Player[] = playersData.map((p) => ({
          id: p.player_id,
          name: p.name,
          cards: p.cards as GameCard[],
          isActive: p.is_active,
          isConnected: p.is_connected,
          isHost: p.is_host,
        }))
        set({ players })

        const host = playersData.find((p) => p.is_host)
        if (host && !host.is_connected) {
          set({ isHostDisconnected: true })
        }
      }
    }

    // Función para cargar estado del juego
    async function loadGameState(code: string) {
      const { data: roomData } = await supabase.from("game_rooms").select("*").eq("code", code).single()

      if (roomData) {
        set({
          gameState: roomData.state as GameState,
          currentTurnPlayerId: roomData.current_turn_player_id,
          selectedAttribute: roomData.selected_attribute,
          startTime: roomData.start_time,
          winnerId: roomData.winner_id,
          gameEndReason: roomData.game_end_reason || "",
        })
      }
    }

    // Función para cargar cartas en juego
    async function loadCardsInPlay(code: string) {
      const { data: cardsData } = await supabase.from("cards_in_play").select("*").eq("room_code", code)

      if (cardsData) {
        const cardsInPlay = cardsData
          .filter((c) => !c.is_tied)
          .map((c) => ({
            playerId: c.player_id,
            card: c.card as GameCard,
          }))

        const tiedCards = cardsData
          .filter((c) => c.is_tied)
          .map((c) => ({
            playerId: c.player_id,
            card: c.card as GameCard,
          }))

        set({ cardsInPlay, tiedCards })
      }
    }

    async function loadChatMessages(code: string) {
      const { data: messagesData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_code", code)
        .order("created_at", { ascending: true })
        .limit(100)

      if (messagesData) {
        const messages: ChatMessage[] = messagesData.map((m) => ({
          id: m.id,
          roomCode: m.room_code,
          playerId: m.player_id,
          playerName: m.player_name,
          message: m.message,
          createdAt: m.created_at,
        }))
        set({ chatMessages: messages })
      }
    }
  },

  unsubscribeFromRoom: () => {
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      const supabase = getSupabaseClient()
      supabase.removeChannel(realtimeChannel)
      set({ realtimeChannel: null })
    }
  },

  sendChatMessage: async (message: string) => {
    const { roomCode, currentPlayerId, players } = get()
    const supabase = getSupabaseClient()

    if (!currentPlayerId || !message.trim()) return

    const currentPlayer = players.find((p) => p.id === currentPlayerId)
    if (!currentPlayer) return

    await supabase.from("chat_messages").insert({
      room_code: roomCode,
      player_id: currentPlayerId,
      player_name: currentPlayer.name,
      message: message.trim(),
    })
  },

  startHeartbeat: () => {
    const { roomCode, currentPlayerId } = get()
    const supabase = getSupabaseClient()

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }

    // Enviar heartbeat cada 5 segundos
    heartbeatInterval = setInterval(async () => {
      if (currentPlayerId && roomCode) {
        await supabase.rpc("update_player_heartbeat", {
          p_room_code: roomCode,
          p_player_id: currentPlayerId,
        })

        // Marcar jugadores desconectados
        await supabase.rpc("mark_disconnected_players")
      }
    }, 5000)

    // Enviar heartbeat inmediatamente
    if (currentPlayerId && roomCode) {
      supabase.rpc("update_player_heartbeat", {
        p_room_code: roomCode,
        p_player_id: currentPlayerId,
      })
    }
  },

  stopHeartbeat: () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  },

  leaveRoom: async () => {
    const { roomCode, currentPlayerId } = get()
    const supabase = getSupabaseClient()

    if (!currentPlayerId || !roomCode) return

    // Marcar como desconectado
    await supabase
      .from("game_players")
      .update({ is_connected: false })
      .eq("room_code", roomCode)
      .eq("player_id", currentPlayerId)

    get().stopHeartbeat()

    // Desuscribirse
    get().unsubscribeFromRoom()
  },

  startGame: async () => {
    const { roomCode, players } = get()
    const supabase = getSupabaseClient()

    if (players.length < 2) {
      console.error("[v0] Not enough players")
      return
    }

    // Distribuir cartas
    const playerCards = distributeCards(players.length)
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      cards: playerCards[index],
    }))

    // Determinar primer jugador
    const firstPlayerId = determineFirstPlayer(updatedPlayers)

    // Actualizar jugadores en la base de datos
    for (let i = 0; i < updatedPlayers.length; i++) {
      const player = updatedPlayers[i]
      await supabase
        .from("game_players")
        .update({
          cards: player.cards,
          is_active: player.id === firstPlayerId,
        })
        .eq("room_code", roomCode)
        .eq("player_id", player.id)
    }

    // Actualizar estado de la sala
    await supabase
      .from("game_rooms")
      .update({
        state: "playing",
        current_turn_player_id: firstPlayerId,
        start_time: Date.now(),
      })
      .eq("code", roomCode)
  },

  // Jugar una carta (local)
  playCard: (playerId: string) => {
    const { players, cardsInPlay } = get()
    const player = players.find((p) => p.id === playerId)

    if (!player || player.cards.length === 0) return

    const card = player.cards[0]
    set({
      cardsInPlay: [...cardsInPlay, { playerId, card }],
    })
  },

  selectAttribute: async (playerId: string, attributeName: string) => {
    const { currentTurnPlayerId, players, roomCode } = get()
    const supabase = getSupabaseClient()

    if (playerId !== currentTurnPlayerId) return

    // Limpiar cartas en juego anteriores
    await supabase.from("cards_in_play").delete().eq("room_code", roomCode).eq("is_tied", false)

    // Todos los jugadores juegan sus cartas
    const cardsToPlay = players
      .filter((p) => p.cards.length > 0)
      .map((p) => ({
        room_code: roomCode,
        player_id: p.id,
        card: p.cards[0],
        is_tied: false,
      }))

    await supabase.from("cards_in_play").insert(cardsToPlay)

    // Actualizar atributo seleccionado
    await supabase.from("game_rooms").update({ selected_attribute: attributeName }).eq("code", roomCode)

    // Resolver la ronda después de un delay
    setTimeout(() => {
      get().resolveRound()
    }, 2000)
  },

  resolveRound: async () => {
    const { cardsInPlay, selectedAttribute, tiedCards, players, startTime, roomCode } = get()
    const supabase = getSupabaseClient()

    if (!selectedAttribute || cardsInPlay.length === 0) return

    // Comparar las cartas
    const { winnerId, isTie } = compareCards(cardsInPlay, selectedAttribute)

    if (isTie) {
      // Empate: marcar cartas como empatadas
      await supabase.from("cards_in_play").update({ is_tied: true }).eq("room_code", roomCode).eq("is_tied", false)

      // Limpiar atributo seleccionado
      await supabase.from("game_rooms").update({ selected_attribute: null }).eq("code", roomCode)
    } else if (winnerId) {
      // Hay un ganador
      const winner = players.find((p) => p.id === winnerId)
      if (!winner) return

      // Obtener todas las cartas ganadas
      const allWonCards = [...cardsInPlay.map((c) => c.card), ...tiedCards.map((c) => c.card)]

      // Actualizar cartas de los jugadores
      for (const player of players) {
        const playedCard = cardsInPlay.find((c) => c.playerId === player.id)
        let newCards = player.cards

        if (playedCard) {
          // Remover la carta jugada
          newCards = player.cards.filter((c) => c.id !== playedCard.card.id)
        }

        if (player.id === winnerId) {
          // Agregar cartas ganadas
          newCards = [...newCards, ...allWonCards]
        }

        await supabase
          .from("game_players")
          .update({
            cards: newCards,
            is_active: player.id === winnerId,
          })
          .eq("room_code", roomCode)
          .eq("player_id", player.id)
      }

      // Limpiar cartas en juego
      await supabase.from("cards_in_play").delete().eq("room_code", roomCode)

      // Verificar si el juego terminó
      const { data: updatedPlayersData } = await supabase.from("game_players").select("*").eq("room_code", roomCode)

      if (updatedPlayersData) {
        const updatedPlayers: Player[] = updatedPlayersData.map((p) => ({
          id: p.player_id,
          name: p.name,
          cards: p.cards as GameCard[],
          isActive: p.is_active,
          isConnected: p.is_connected,
          isHost: p.is_host,
        }))

        const gameEnd = checkGameEnd(updatedPlayers, startTime)

        if (gameEnd.isEnded) {
          await supabase
            .from("game_rooms")
            .update({
              state: "finished",
              winner_id: gameEnd.winnerId,
              game_end_reason: gameEnd.reason,
              selected_attribute: null,
              current_turn_player_id: null,
            })
            .eq("code", roomCode)
        } else {
          await supabase
            .from("game_rooms")
            .update({
              current_turn_player_id: winnerId,
              selected_attribute: null,
            })
            .eq("code", roomCode)
        }
      }
    }
  },

  // Reiniciar el juego
  resetGame: () => {
    get().stopHeartbeat()
    get().unsubscribeFromRoom()
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
      currentPlayerId: null,
      chatMessages: [],
      isHostDisconnected: false,
    })
  },
}))
