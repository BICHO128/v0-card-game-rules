"use client"

import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import type { Player } from "@/lib/game-types"

type GameHeaderProps = {
  roomCode: string
  players: Player[]
  currentPlayerId: string
}

export function GameHeader({ roomCode, players, currentPlayerId }: GameHeaderProps) {
  return (
    <div className="border-b bg-card/50 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Código de sala */}
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 px-3 py-1.5 rounded-lg">
              <p className="text-xs text-muted-foreground">Sala</p>
              <p className="text-sm font-bold font-mono">{roomCode}</p>
            </div>
          </div>

          {/* Jugadores */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2 flex-wrap">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    player.id === currentPlayerId
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{player.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {player.cards.length}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
