"use client"

import { motion } from "framer-motion"
import type { GameCard } from "@/lib/game-types"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

type CardFlipProps = {
  card: GameCard
  isRevealed: boolean
  selectedAttribute?: string
}

export function CardFlip({ card, isRevealed, selectedAttribute }: CardFlipProps) {
  const attributeValue = selectedAttribute ? card.attributes.find((a) => a.name === selectedAttribute)?.value : null

  return (
    <motion.div
      initial={{ rotateY: 180 }}
      animate={{ rotateY: isRevealed ? 0 : 180 }}
      transition={{ duration: 0.6 }}
      style={{ transformStyle: "preserve-3d" }}
      className="relative w-full aspect-[3/4]"
    >
      {/* Parte trasera */}
      <div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-secondary p-1"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
      >
        <div className="w-full h-full rounded-lg bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-primary">?</span>
            </div>
            <p className="text-sm text-muted-foreground">Card Match</p>
          </div>
        </div>
      </div>

      {/* Parte delantera */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden border-2 border-primary/30 bg-card"
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className="relative h-2/3 bg-muted">
          <Image src={card.image || "/placeholder.svg"} alt={card.name} fill className="object-cover" />
        </div>
        <div className="p-3 space-y-2">
          <div className="text-center">
            <p className="font-bold text-sm">{card.name}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {card.category}
            </Badge>
          </div>
          {attributeValue !== null && (
            <div className="text-center">
              <Badge variant="default" className="text-lg px-3 py-1">
                {selectedAttribute}: {attributeValue}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
