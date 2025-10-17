"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGameStore } from "@/lib/game-store"
import { GameBoard } from "@/components/game-board"
import { PlayerHand } from "@/components/player-hand"
import { GameHeader } from "@/components/game-header"
import { GameResults } from "@/components/game-results"
import { GameTimer } from "@/components/game-timer"
import { GameChat } from "@/components/game-chat"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string

  const gameState = useGameStore((state) => state.gameState)
  const players = useGameStore((state) => state.players)
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId)
  const startTime = useGameStore((state) => state.startTime)
  const currentPlayerId = useGameStore((state) => state.currentPlayerId)
  const isHostDisconnected = useGameStore((state) => state.isHostDisconnected)
  const subscribeToRoom = useGameStore((state) => state.subscribeToRoom)
  const unsubscribeFromRoom = useGameStore((state) => state.unsubscribeFromRoom)
  const leaveRoom = useGameStore((state) => state.leaveRoom)
  const resetGame = useGameStore((state) => state.resetGame)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar que tengamos un jugador actual
    const storedPlayerId = currentPlayerId
    if (!storedPlayerId) {
      router.push("/")
      return
    }

    subscribeToRoom(roomCode)
    setIsLoading(false)

    const handleBeforeUnload = () => {
      leaveRoom()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      unsubscribeFromRoom()
    }
  }, [roomCode, currentPlayerId, router, subscribeToRoom, unsubscribeFromRoom, leaveRoom])

  useEffect(() => {
    if (isHostDisconnected) {
      // Esperar 2 segundos antes de redirigir
      const timeout = setTimeout(() => {
        resetGame()
        router.push("/")
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [isHostDisconnected, router, resetGame])

  const handleTimeUp = async () => {
    const { players } = useGameStore.getState()
    const supabase = (await import("@/lib/supabase-client")).getSupabaseClient()

    // Forzar el fin del juego por timeout
    const sortedPlayers = [...players].sort((a, b) => b.cards.length - a.cards.length)
    const maxCards = sortedPlayers[0].cards.length
    const winners = sortedPlayers.filter((p) => p.cards.length === maxCards)

    await supabase
      .from("game_rooms")
      .update({
        state: "finished",
        winner_id: winners.length === 1 ? winners[0].id : null,
        game_end_reason: "timeout",
      })
      .eq("code", roomCode)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Preparando el juego...</p>
        </div>
      </div>
    )
  }

  if (isHostDisconnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Juego Terminado</AlertTitle>
          <AlertDescription>
            El anfitrión se ha desconectado. Serás redirigido a la página principal...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (gameState === "finished") {
    return <GameResults />
  }

  const currentPlayer = players.find((p) => p.id === currentPlayerId)
  const isMyTurn = currentTurnPlayerId === currentPlayerId

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <GameHeader roomCode={roomCode} players={players} currentPlayerId={currentPlayerId || ""} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {startTime && <GameTimer startTime={startTime} onTimeUp={handleTimeUp} />}

        <GameBoard
          players={players}
          currentTurnPlayerId={currentTurnPlayerId}
          currentPlayerId={currentPlayerId || ""}
        />

        {currentPlayer && currentPlayer.cards.length > 0 && (
          <PlayerHand
            card={currentPlayer.cards[0]}
            isMyTurn={isMyTurn}
            playerId={currentPlayerId || ""}
            totalCards={currentPlayer.cards.length}
          />
        )}
      </div>

      {gameState === "playing" && <GameChat />}
    </div>
  )
}
