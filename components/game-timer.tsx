"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type GameTimerProps = {
  startTime: number
  onTimeUp: () => void
}

const GAME_DURATION = 30 * 60 * 1000 // 30 minutos en milisegundos

export function GameTimer({ startTime, onTimeUp }: GameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, GAME_DURATION - elapsed)
      setTimeRemaining(remaining)

      // Mostrar advertencia en los últimos 5 minutos
      if (remaining <= 5 * 60 * 1000 && remaining > 0) {
        setShowWarning(true)
      }

      // Tiempo agotado
      if (remaining === 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, onTimeUp])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const progressPercentage = (timeRemaining / GAME_DURATION) * 100

  return (
    <Card className={`border-2 ${showWarning ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${showWarning ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Tiempo Restante</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${showWarning ? "text-destructive" : ""}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          <Progress value={progressPercentage} className={`h-2 ${showWarning ? "[&>div]:bg-destructive" : ""}`} />

          <AnimatePresence>
            {showWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Quedan menos de 5 minutos</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
