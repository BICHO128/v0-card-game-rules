"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Swords, Zap, Crown } from "lucide-react"

type BattleAnimationProps = {
  isActive: boolean
  winnerName?: string
  isTie?: boolean
}

export function BattleAnimation({ isActive, winnerName, isTie }: BattleAnimationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isActive) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [isActive])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            {isTie ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Swords className="w-24 h-24 text-muted-foreground mx-auto" />
                </motion.div>
                <h2 className="text-4xl font-bold">¡Empate!</h2>
                <p className="text-xl text-muted-foreground">Se juega otra ronda</p>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <Crown className="w-24 h-24 text-primary mx-auto" />
                </motion.div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ¡{winnerName} Gana!
                </h2>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.3, repeat: 3 }}>
                  <Zap className="w-12 h-12 text-secondary mx-auto" />
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
