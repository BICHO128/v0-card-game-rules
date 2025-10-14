"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGameStore } from "@/lib/game-store"
import { GameBoard } from "@/components/game-board"
import { PlayerHand } from "@/components/player-hand"
import { GameHeader } from "@/components/game-header"
import { GameResults } from "@/components/game-results"
import { GameTimer } from "@/components/game-timer"
import { Loader2 } from "lucide-react"

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string

  const { gameState, players, initializeGame, currentTurnPlayerId, startTime } = useGameStore()
  const [isLoading, setIsLoading] = useState(true)
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("")

  useEffect(() => {
    // Cargar datos del localStorage
    const storedPlayers = localStorage.getItem("players")
    const playerName = localStorage.getItem("playerName")

    if (!storedPlayers || !playerName) {
      router.push("/")
      return
    }

    const playersData = JSON.parse(storedPlayers)
    const playerNames = playersData.map((p: any) => p.name)

    // Inicializar el juego
    initializeGame(roomCode, playerNames)

    // Encontrar el ID del jugador actual
    setTimeout(() => {
      const currentPlayer = useGameStore.getState().players.find((p) => p.name === playerName)
      if (currentPlayer) {
        setCurrentPlayerId(currentPlayer.id)
      }
      setIsLoading(false)
    }, 100)
  }, [roomCode, router, initializeGame])

  const handleTimeUp = () => {
    const { players, startTime } = useGameStore.getState()
    const gameEnd = useGameStore.getState()

    // Forzar el fin del juego por timeout
    const sortedPlayers = [...players].sort((a, b) => b.cards.length - a.cards.length)
    const maxCards = sortedPlayers[0].cards.length
    const winners = sortedPlayers.filter((p) => p.cards.length === maxCards)

    useGameStore.setState({
      gameState: "finished",
      winnerId: winners.length === 1 ? winners[0].id : null,
      gameEndReason: "timeout",
    })
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

  if (gameState === "finished") {
    return <GameResults />
  }

  const currentPlayer = players.find((p) => p.id === currentPlayerId)
  const isMyTurn = currentTurnPlayerId === currentPlayerId

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <GameHeader roomCode={roomCode} players={players} currentPlayerId={currentPlayerId} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {startTime && <GameTimer startTime={startTime} onTimeUp={handleTimeUp} />}

        <GameBoard players={players} currentTurnPlayerId={currentTurnPlayerId} currentPlayerId={currentPlayerId} />

        {currentPlayer && currentPlayer.cards.length > 0 && (
          <PlayerHand
            card={currentPlayer.cards[0]}
            isMyTurn={isMyTurn}
            playerId={currentPlayerId}
            totalCards={currentPlayer.cards.length}
          />
        )}
      </div>
    </div>
  )
}
