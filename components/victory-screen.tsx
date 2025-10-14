"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Clock, Users, Sparkles, Home } from "lucide-react"
import { motion } from "framer-motion"
import type { Player } from "@/lib/game-types"

type VictoryScreenProps = {
  players: Player[]
  winnerId: string | null
  gameEndReason: string
  onPlayAgain: () => void
  onExit: () => void
}

export function VictoryScreen({ players, winnerId, gameEndReason, onPlayAgain, onExit }: VictoryScreenProps) {
  const winner = players.find((p) => p.id === winnerId)
  const sortedPlayers = [...players].sort((a, b) => b.cards.length - a.cards.length)

  const getReasonText = () => {
    switch (gameEndReason) {
      case "all-cards":
        return "Victoria Absoluta"
      case "last-standing":
        return "Último Jugador en Pie"
      case "timeout":
        return "Tiempo Agotado"
      default:
        return "Juego Terminado"
    }
  }

  const getReasonDescription = () => {
    switch (gameEndReason) {
      case "all-cards":
        return "Ha reunido todas las cartas del juego"
      case "last-standing":
        return "Es el único jugador con cartas restantes"
      case "timeout":
        return "Ganador por mayor cantidad de cartas"
      default:
        return ""
    }
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-400 to-yellow-600"
      case 1:
        return "from-gray-300 to-gray-500"
      case 2:
        return "from-orange-400 to-orange-600"
      default:
        return "from-muted to-muted"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-2 border-primary/30 shadow-2xl">
          <CardHeader className="text-center pb-6 space-y-4">
            {/* Trofeo animado */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 1, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-primary-foreground" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-8 h-8 text-secondary" />
                </motion.div>
              </div>
            </motion.div>

            {/* Título */}
            <div className="space-y-2">
              <CardTitle className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {winner ? `¡${winner.name} Gana!` : "¡Empate!"}
              </CardTitle>
              <div className="flex flex-col items-center gap-2">
                <Badge variant="secondary" className="text-base px-4 py-1">
                  {getReasonText()}
                </Badge>
                {winner && <p className="text-sm text-muted-foreground">{getReasonDescription()}</p>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Clasificación */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Medal className="w-5 h-5 text-primary" />
                Clasificación Final
              </h3>
              <div className="space-y-3">
                {sortedPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0
                        ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/40"
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center font-bold text-white text-lg shadow-lg`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-semibold ${index === 0 ? "text-lg" : ""}`}>{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.category || "Jugador"}</p>
                      </div>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-base px-3 py-1">
                      {player.cards.length} cartas
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{players.length}</p>
                <p className="text-sm text-muted-foreground">Jugadores</p>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 text-secondary mx-auto mb-1" />
                <p className="text-2xl font-bold">{gameEndReason === "timeout" ? "30:00" : "< 30:00"}</p>
                <p className="text-sm text-muted-foreground">Duración</p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" size="lg" onClick={onPlayAgain}>
                <Sparkles className="w-5 h-5 mr-2" />
                Jugar de Nuevo
              </Button>
              <Button variant="outline" size="lg" onClick={onExit}>
                <Home className="w-5 h-5 mr-2" />
                Salir
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
