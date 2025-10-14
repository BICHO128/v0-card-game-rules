"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Gamepad2, Users, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { generateRoomCode } from "@/lib/game-logic"

export default function HomePage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const handleCreateRoom = () => {
    if (!playerName.trim()) return
    setIsCreating(true)
    const code = generateRoomCode()
    // Guardar en localStorage
    localStorage.setItem("playerName", playerName)
    localStorage.setItem("roomCode", code)
    localStorage.setItem("isHost", "true")
    router.push(`/lobby/${code}`)
  }

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return
    setIsJoining(true)
    // Guardar en localStorage
    localStorage.setItem("playerName", playerName)
    localStorage.setItem("roomCode", roomCode.toUpperCase())
    localStorage.setItem("isHost", "false")
    router.push(`/lobby/${roomCode.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Card Match Battle
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Pon a prueba tu estrategia en batallas de cartas comparativas. Elige sabiamente tus atributos y acumula
            todas las cartas para ganar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Crear Partida */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>Crear Partida</CardTitle>
              </div>
              <CardDescription>Inicia una nueva sala y comparte el código con tus amigos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Tu Nombre</Label>
                <Input
                  id="create-name"
                  placeholder="Ingresa tu nombre"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCreateRoom}
                disabled={!playerName.trim() || isCreating}
              >
                {isCreating ? "Creando..." : "Crear Sala"}
              </Button>
            </CardContent>
          </Card>

          {/* Unirse a Partida */}
          <Card className="border-2 hover:border-secondary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-secondary" />
                <CardTitle>Unirse a Partida</CardTitle>
              </div>
              <CardDescription>Ingresa el código de sala para unirte a una partida existente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-name">Tu Nombre</Label>
                <Input
                  id="join-name"
                  placeholder="Ingresa tu nombre"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-code">Código de Sala</Label>
                <Input
                  id="room-code"
                  placeholder="Ej: ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="uppercase font-mono"
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                variant="secondary"
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomCode.trim() || isJoining}
              >
                {isJoining ? "Uniéndose..." : "Unirse a Sala"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reglas del Juego */}
        <Card className="mt-8 max-w-4xl mx-auto bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-center">¿Cómo Jugar?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">
                  1
                </div>
                <h3 className="font-semibold">Reúne Jugadores</h3>
                <p className="text-muted-foreground">
                  De 2 a 4 jugadores pueden unirse a la partida usando el código de sala.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">
                  2
                </div>
                <h3 className="font-semibold">Elige Atributos</h3>
                <p className="text-muted-foreground">
                  En tu turno, selecciona el atributo más fuerte de tu carta para competir.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">
                  3
                </div>
                <h3 className="font-semibold">Gana Cartas</h3>
                <p className="text-muted-foreground">
                  El valor más alto gana todas las cartas en juego. ¡Acumula todas para ganar!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
