"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import type { CardAttribute } from "@/lib/game-types"
import { Zap, Shield, Gauge, Star } from "lucide-react"

type AttributeSelectorProps = {
  attributes: CardAttribute[]
  onSelect: (attributeName: string) => void
  disabled: boolean
  selectedAttribute?: string
}

const attributeIcons: Record<string, any> = {
  Poder: Zap,
  Velocidad: Gauge,
  Defensa: Shield,
  Rareza: Star,
}

export function AttributeSelector({ attributes, onSelect, disabled, selectedAttribute }: AttributeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {attributes.map((attr, index) => {
        const Icon = attributeIcons[attr.name] || Zap
        const isSelected = selectedAttribute === attr.name

        return (
          <motion.div
            key={attr.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant={isSelected ? "default" : "outline"}
              size="lg"
              className="w-full h-auto py-4 flex flex-col gap-2 relative overflow-hidden group"
              onClick={() => onSelect(attr.name)}
              disabled={disabled || !!selectedAttribute}
            >
              {!disabled && !selectedAttribute && (
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              )}
              <Icon className={`w-5 h-5 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
              <span className={`text-sm ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                {attr.name}
              </span>
              <span className={`text-2xl font-bold ${isSelected ? "text-primary-foreground" : ""}`}>{attr.value}</span>
            </Button>
          </motion.div>
        )
      })}
    </div>
  )
}
