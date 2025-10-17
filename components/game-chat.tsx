"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MessageCircle, X, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function GameChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatMessages = useGameStore((state) => state.chatMessages)
  const currentPlayerId = useGameStore((state) => state.currentPlayerId)
  const sendChatMessage = useGameStore((state) => state.sendChatMessage)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    await sendChatMessage(message)
    setMessage("")
  }

  return (
    <>
      {/* Botón flotante */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </motion.div>

      {/* Panel de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-40 w-80 sm:w-96"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="flex flex-col h-[500px] shadow-2xl">
              {/* Header */}
              <div className="p-4 border-b bg-primary/5">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat del Juego
                </h3>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No hay mensajes aún. ¡Sé el primero en escribir!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isOwnMessage = msg.playerId === currentPlayerId
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-lg px-3 py-2",
                            isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          {!isOwnMessage && (
                            <div className="text-xs font-semibold mb-1 opacity-70">{msg.playerName}</div>
                          )}
                          <div className="text-sm break-words">{msg.message}</div>
                          <div className="text-xs opacity-60 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    maxLength={200}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
