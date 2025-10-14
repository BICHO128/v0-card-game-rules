"use client"

import { useGameStore } from "@/lib/game-store"
import { VictoryScreen } from "@/components/victory-screen"
import { useRouter } from "next/navigation"

export function GameResults() {
  const router = useRouter()
  const { players, winnerId, gameEndReason, resetGame } = useGameStore()

  const handlePlayAgain = () => {
    resetGame()
    router.push("/")
  }

  const handleExit = () => {
    resetGame()
    router.push("/")
  }

  return (
    <VictoryScreen
      players={players}
      winnerId={winnerId}
      gameEndReason={gameEndReason}
      onPlayAgain={handlePlayAgain}
      onExit={handleExit}
    />
  )
}
