"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Users, Play, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type LobbyPlayer = {
  id: string
  name: string
  isHost: boolean
}

export default function LobbyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const roomCode = params.code as string

  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [copied, setCopied] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [playerName, setPlayerName] = useState("")

  useEffect(() => {
    // Cargar datos del localStorage
    const storedName = localStorage.getItem("playerName") || "Jugador"
    const storedIsHost = localStorage.getItem("isHost") === "true"
    setPlayerName(storedName)
    setIsHost(storedIsHost)

    // Simular jugadores (en producción esto vendría de un servidor)
    const currentPlayer: LobbyPlayer = {
      id: Math.random().toString(36).substr(2, 9),
      name: storedName,
      isHost: storedIsHost,
    }

    setPlayers([currentPlayer])
  }, [])

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast({
      title: "Código copiado",
      description: "El código de sala ha sido copiado al portapapeles",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const startGame = () => {
    if (players.length < 2) {
      toast({
        title: "Jugadores insuficientes",
        description: "Se necesitan al menos 2 jugadores para comenzar",
        variant: "destructive",
      })
      return
    }

    // Guardar jugadores en localStorage
    localStorage.setItem("players", JSON.stringify(players))
    router.push(`/game/${roomCode}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">Sala de Espera</CardTitle>
            <CardDescription>Comparte el código con tus amigos para que se unan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Código de Sala */}
            <div className="flex items-center justify-center gap-3">
              <div className="bg-muted px-6 py-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Código de Sala</p>
                <p className="text-3xl font-bold font-mono tracking-wider">{roomCode}</p>
              </div>
              <Button variant="outline" size="icon" onClick={copyRoomCode} className="h-12 w-12 bg-transparent">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>

            {/* Lista de Jugadores */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Jugadores ({players.length}/4)</span>
              </div>
              <div className="space-y-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{player.name}</span>
                    {player.isHost && <Badge variant="secondary">Anfitrión</Badge>}
                  </div>
                ))}
                {players.length < 4 && (
                  <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg text-muted-foreground">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Esperando más jugadores...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de Inicio */}
            {isHost && (
              <Button className="w-full" size="lg" onClick={startGame} disabled={players.length < 2}>
                <Play className="w-5 h-5 mr-2" />
                Iniciar Partida
              </Button>
            )}

            {!isHost && (
              <div className="text-center text-sm text-muted-foreground">
                Esperando a que el anfitrión inicie la partida...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
