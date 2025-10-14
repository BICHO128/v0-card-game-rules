"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GameCard } from "@/lib/game-types"
import { useGameStore } from "@/lib/game-store"
import Image from "next/image"
import { Layers } from "lucide-react"
import { AttributeSelector } from "@/components/attribute-selector"

type PlayerHandProps = {
  card: GameCard
  isMyTurn: boolean
  playerId: string
  totalCards: number
}

export function PlayerHand({ card, isMyTurn, playerId, totalCards }: PlayerHandProps) {
  const { selectAttribute, selectedAttribute } = useGameStore()

  const handleSelectAttribute = (attributeName: string) => {
    if (!isMyTurn || selectedAttribute) return
    selectAttribute(playerId, attributeName)
  }

  return (
    <Card className="border-2 border-primary/30 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tu Carta</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="w-4 h-4" />
            <span>
              {totalCards} carta{totalCards !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Imagen de la carta */}
          <div className="space-y-3">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted border-2 border-border shadow-lg">
              <Image src={card.image || "/placeholder.svg"} alt={card.name} fill className="object-cover" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{card.name}</p>
              <Badge variant="outline" className="mt-1">
                {card.category}
              </Badge>
            </div>
          </div>

          {/* Atributos */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {isMyTurn ? "Selecciona un atributo para competir:" : "Esperando tu turno..."}
            </p>
            <AttributeSelector
              attributes={card.attributes}
              onSelect={handleSelectAttribute}
              disabled={!isMyTurn}
              selectedAttribute={selectedAttribute || undefined}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
