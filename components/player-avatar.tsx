"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Crown } from "lucide-react"

type PlayerAvatarProps = {
  name: string
  cardCount: number
  isActive: boolean
  isCurrentPlayer?: boolean
}

export function PlayerAvatar({ name, cardCount, isActive, isCurrentPlayer }: PlayerAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isActive ? Number.POSITIVE_INFINITY : 0 }}
      className={`relative ${isCurrentPlayer ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full" : ""}`}
    >
      <div className="text-center space-y-2">
        <div className="relative inline-block">
          <Avatar className={`w-16 h-16 border-2 ${isActive ? "border-primary" : "border-border"}`}>
            <AvatarFallback className={isActive ? "bg-primary text-primary-foreground" : "bg-muted"}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {isActive && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute -top-1 -right-1"
            >
              <Crown className="w-5 h-5 text-primary" />
            </motion.div>
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>{name}</p>
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {cardCount} cartas
          </Badge>
        </div>
      </div>
    </motion.div>
  )
}
