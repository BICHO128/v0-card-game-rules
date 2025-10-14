"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Player } from "@/lib/game-types"
import { useGameStore } from "@/lib/game-store"
import { Sparkles, Swords } from "lucide-react"
import { CardFlip } from "@/components/card-flip"
import { PlayerAvatar } from "@/components/player-avatar"
import { BattleAnimation } from "@/components/battle-animation"
import { useState, useEffect } from "react"

type GameBoardProps = {
  players: Player[]
  currentTurnPlayerId: string | null
  currentPlayerId: string
}

export function GameBoard({ players, currentTurnPlayerId, currentPlayerId }: GameBoardProps) {
  const { cardsInPlay, selectedAttribute, tiedCards } = useGameStore()
  const [showBattle, setShowBattle] = useState(false)
  const [battleWinner, setBattleWinner] = useState<string>("")
  const [isBattleTie, setIsBattleTie] = useState(false)

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId)
  const isMyTurn = currentTurnPlayerId === currentPlayerId

  useEffect(() => {
    if (cardsInPlay.length === players.filter((p) => p.cards.length > 0).length && selectedAttribute) {
      // Mostrar animación de batalla
      setShowBattle(true)

      // Determinar ganador para la animación
      const values = cardsInPlay.map(({ playerId, card }) => {
        const attr = card.attributes.find((a) => a.name === selectedAttribute)
        return { playerId, value: attr?.value ?? 0 }
      })

      const maxValue = Math.max(...values.map((v) => v.value))
      const winners = values.filter((v) => v.value === maxValue)

      if (winners.length > 1) {
        setIsBattleTie(true)
      } else {
        const winner = players.find((p) => p.id === winners[0].playerId)
        setBattleWinner(winner?.name || "")
        setIsBattleTie(false)
      }
    }
  }, [cardsInPlay, selectedAttribute, players])

  return (
    <div className="space-y-6">
      <BattleAnimation isActive={showBattle} winnerName={battleWinner} isTie={isBattleTie} />

      {/* Indicador de turno */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-3">
            {isMyTurn ? (
              <>
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <p className="text-lg font-semibold">Es tu turno - Elige un atributo</p>
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </>
            ) : (
              <>
                <Swords className="w-5 h-5 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  Turno de <span className="font-semibold text-foreground">{currentTurnPlayer?.name}</span>
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avatares de jugadores */}
      <div className="flex justify-center gap-8 flex-wrap">
        {players.map((player) => (
          <PlayerAvatar
            key={player.id}
            name={player.name}
            cardCount={player.cards.length}
            isActive={player.id === currentTurnPlayerId}
            isCurrentPlayer={player.id === currentPlayerId}
          />
        ))}
      </div>

      {/* Atributo seleccionado */}
      {selectedAttribute && (
        <div className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Atributo en batalla: {selectedAttribute}
          </Badge>
        </div>
      )}

      {/* Cartas en juego */}
      {cardsInPlay.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {cardsInPlay.map(({ playerId, card }) => {
            const player = players.find((p) => p.id === playerId)

            return (
              <div key={playerId} className="space-y-2">
                <div className="bg-card/50 backdrop-blur rounded-lg p-2">
                  <p className="text-xs font-medium text-center text-muted-foreground">{player?.name}</p>
                </div>
                <CardFlip card={card} isRevealed={true} selectedAttribute={selectedAttribute || undefined} />
              </div>
            )
          })}
        </div>
      )}

      {/* Cartas empatadas */}
      {tiedCards.length > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="text-sm px-3 py-1 border-destructive text-destructive">
            Empate - {tiedCards.length} cartas acumuladas
          </Badge>
        </div>
      )}
    </div>
  )
}
