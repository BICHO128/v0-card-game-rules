# Documentación Técnica: Sistema Multijugador y Chat en Tiempo Real

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [¿Por qué NO WebSockets Puros?](#por-qué-no-websockets-puros)
5. [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
6. [Sistema Multijugador](#sistema-multijugador)
7. [Sistema de Detección de Desconexión](#sistema-de-detección-de-desconexión)
8. [Sistema de Chat en Tiempo Real](#sistema-de-chat-en-tiempo-real)
9. [Flujo de Datos](#flujo-de-datos)
10. [Implementación Paso a Paso](#implementación-paso-a-paso)
11. [Código de Ejemplo](#código-de-ejemplo)
12. [Ventajas y Desventajas](#ventajas-y-desventajas)

---

## Introducción

Este documento explica la arquitectura y funcionamiento del sistema multijugador en tiempo real implementado para el juego **Card Match Battle**. El sistema permite que múltiples jugadores (2-4) se conecten a una misma partida, jueguen en tiempo real, detecten desconexiones automáticamente y se comuniquen mediante un chat en vivo.

### Características Principales:
- ✅ Conexión multijugador en tiempo real (2-4 jugadores)
- ✅ Sincronización automática del estado del juego
- ✅ Detección automática de desconexiones
- ✅ Chat en vivo entre jugadores
- ✅ Manejo de desconexión del anfitrión
- ✅ Sin necesidad de servidor WebSocket personalizado

---

## Arquitectura General

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Components (Next.js)                            │ │
│  │  - Lobby Page                                          │ │
│  │  - Game Page                                           │ │
│  │  - Chat Component                                      │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Game Store (Zustand + Supabase Client)               │ │
│  │  - Estado local del juego                             │ │
│  │  - Funciones de sincronización                        │ │
│  │  - Suscripciones a cambios                            │ │
│  └────────────────┬───────────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    │ Supabase Realtime (WebSockets)
                    │
┌───────────────────▼──────────────────────────────────────────┐
│                  SUPABASE (Backend)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                   │ │
│  │  - game_rooms                                          │ │
│  │  - game_players                                        │ │
│  │  - cards_in_play                                       │ │
│  │  - chat_messages                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Realtime Engine                                       │ │
│  │  - Broadcast changes via WebSockets                    │ │
│  │  - Manage subscriptions                                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
\`\`\`

---

## Tecnologías Utilizadas

### 1. **Supabase Realtime**
- **Qué es**: Sistema de sincronización en tiempo real basado en PostgreSQL y WebSockets
- **Uso**: Sincronización del estado del juego, jugadores y mensajes de chat
- **Ventaja**: No requiere servidor WebSocket personalizado

### 2. **PostgreSQL (Supabase)**
- **Qué es**: Base de datos relacional
- **Uso**: Almacenamiento persistente de salas, jugadores, cartas y mensajes
- **Ventaja**: Datos estructurados con relaciones y consultas SQL

### 3. **Zustand**
- **Qué es**: Librería de gestión de estado para React
- **Uso**: Estado local del cliente + sincronización con Supabase
- **Ventaja**: Simple, ligero y fácil de integrar

### 4. **Next.js 15 (App Router)**
- **Qué es**: Framework de React
- **Uso**: Estructura de la aplicación y routing
- **Ventaja**: Server Components, optimización automática

### 5. **TypeScript**
- **Qué es**: JavaScript con tipos estáticos
- **Uso**: Todo el código del proyecto
- **Ventaja**: Seguridad de tipos y mejor DX

---

## ¿Por qué NO WebSockets Puros?

### Opción 1: WebSockets Puros (NO elegida)

\`\`\`typescript
// Requiere servidor WebSocket personalizado
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Manejar mensajes manualmente
};

ws.send(JSON.stringify({ type: 'join', roomCode: '123456' }));
\`\`\`

**Desventajas:**
- ❌ Requiere configurar y mantener un servidor WebSocket separado (Node.js, Socket.io, etc.)
- ❌ Necesitas manejar manualmente: reconexiones, heartbeats, autenticación
- ❌ No hay persistencia automática de datos
- ❌ Más código boilerplate
- ❌ Más complejo de escalar
- ❌ Requiere infraestructura adicional (servidor, hosting, etc.)

### Opción 2: Supabase Realtime (ELEGIDA) ✅

\`\`\`typescript
// Supabase maneja todo automáticamente
const channel = supabase
  .channel(`room:${roomCode}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'game_players' },
    (payload) => {
      // Cambios automáticos desde la DB
    }
  )
  .subscribe();
\`\`\`

**Ventajas:**
- ✅ **Sin servidor personalizado**: Supabase maneja todo el backend
- ✅ **Persistencia automática**: Los datos se guardan en PostgreSQL
- ✅ **Reconexión automática**: Supabase maneja desconexiones
- ✅ **Autenticación integrada**: Sistema de auth incluido
- ✅ **Escalabilidad**: Supabase escala automáticamente
- ✅ **Menos código**: API simple y declarativa
- ✅ **Realtime + Database**: Sincronización bidireccional automática

### Comparación Técnica

| Característica | WebSockets Puros | Supabase Realtime |
|----------------|------------------|-------------------|
| Servidor requerido | ✅ Sí (Node.js, etc.) | ❌ No |
| Persistencia de datos | Manual (Redis, DB) | ✅ Automática (PostgreSQL) |
| Reconexión automática | Manual | ✅ Automática |
| Autenticación | Manual | ✅ Integrada |
| Escalabilidad | Manual | ✅ Automática |
| Código boilerplate | Alto | Bajo |
| Costo de infraestructura | Alto | Bajo (free tier generoso) |

### ¿Supabase Realtime usa WebSockets?

**Sí**, internamente Supabase Realtime **SÍ usa WebSockets**, pero los abstrae completamente. Tú no necesitas manejar la conexión WebSocket directamente. Supabase se encarga de:

1. Establecer la conexión WebSocket
2. Mantener la conexión viva (heartbeats)
3. Reconectar automáticamente si se pierde la conexión
4. Serializar/deserializar mensajes
5. Manejar autenticación y autorización
6. Sincronizar cambios de la base de datos

**En resumen**: Usamos Supabase Realtime porque nos da todas las ventajas de WebSockets sin la complejidad de implementarlos desde cero.

---

## Estructura de la Base de Datos

### Tabla: `game_rooms`
Almacena información de cada sala de juego.

\`\`\`sql
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  max_players INTEGER DEFAULT 4,
  current_turn TEXT,
  selected_attribute TEXT,
  game_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

**Campos importantes:**
- `room_code`: Código único de 6 caracteres para unirse
- `host_id`: ID del jugador anfitrión
- `status`: Estado del juego (`waiting`, `playing`, `finished`)
- `current_turn`: ID del jugador que tiene el turno actual

### Tabla: `game_players`
Almacena los jugadores en cada sala.

\`\`\`sql
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT TRUE,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_code, player_id)
);
\`\`\`

**Campos importantes:**
- `is_connected`: Indica si el jugador está conectado
- `last_heartbeat`: Última señal de vida del jugador
- `card_count`: Número de cartas que tiene el jugador

### Tabla: `cards_in_play`
Almacena las cartas que están en juego en cada ronda.

\`\`\`sql
CREATE TABLE cards_in_play (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  card_data JSONB NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Tabla: `chat_messages`
Almacena los mensajes del chat.

\`\`\`sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Índices para Optimización

\`\`\`sql
CREATE INDEX idx_game_players_room ON game_players(room_code);
CREATE INDEX idx_game_players_connected ON game_players(room_code, is_connected);
CREATE INDEX idx_cards_in_play_room ON cards_in_play(room_code);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_code, created_at DESC);
\`\`\`

---

## Sistema Multijugador

### 1. Creación de Sala

**Flujo:**
\`\`\`
Usuario → Clic en "Crear Partida" → Genera código único → Inserta en DB → Redirige a lobby
\`\`\`

**Código:**
\`\`\`typescript
// lib/game-store.ts
async createRoom(playerName: string) {
  const roomCode = this.generateRoomCode(); // Genera código de 6 caracteres
  const playerId = `player_${Date.now()}_${Math.random()}`;
  
  // 1. Crear sala en la base de datos
  const { error: roomError } = await supabase
    .from('game_rooms')
    .insert({
      room_code: roomCode,
      host_id: playerId,
      status: 'waiting'
    });
  
  // 2. Agregar jugador como anfitrión
  const { error: playerError } = await supabase
    .from('game_players')
    .insert({
      room_code: roomCode,
      player_id: playerId,
      player_name: playerName,
      is_host: true,
      is_connected: true
    });
  
  // 3. Guardar en estado local
  set({
    roomCode,
    playerId,
    playerName,
    isHost: true
  });
  
  return roomCode;
}
\`\`\`

### 2. Unirse a Sala

**Flujo:**
\`\`\`
Usuario → Ingresa código → Valida sala → Inserta jugador → Redirige a lobby
\`\`\`

**Código:**
\`\`\`typescript
async joinRoom(roomCode: string, playerName: string) {
  // 1. Verificar que la sala existe y está disponible
  const { data: room } = await supabase
    .from('game_rooms')
    .select('*, game_players(*)')
    .eq('room_code', roomCode)
    .single();
  
  if (!room) throw new Error('Sala no encontrada');
  if (room.status !== 'waiting') throw new Error('La partida ya comenzó');
  if (room.game_players.length >= 4) throw new Error('Sala llena');
  
  // 2. Agregar jugador a la sala
  const playerId = `player_${Date.now()}_${Math.random()}`;
  
  await supabase
    .from('game_players')
    .insert({
      room_code: roomCode,
      player_id: playerId,
      player_name: playerName,
      is_host: false,
      is_connected: true
    });
  
  // 3. Guardar en estado local
  set({
    roomCode,
    playerId,
    playerName,
    isHost: false
  });
}
\`\`\`

### 3. Suscripción a Cambios en Tiempo Real

**Flujo:**
\`\`\`
Componente monta → Suscribe a canal → Escucha cambios → Actualiza UI
\`\`\`

**Código:**
\`\`\`typescript
subscribeToRoom(roomCode: string) {
  // 1. Crear canal de Supabase
  const channel = supabase.channel(`room:${roomCode}`, {
    config: {
      broadcast: { self: true }
    }
  });
  
  // 2. Suscribirse a cambios en game_rooms
  channel.on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'game_rooms',
      filter: `room_code=eq.${roomCode}`
    },
    (payload) => {
      console.log('[v0] Room updated:', payload.new);
      set({ room: payload.new });
    }
  );
  
  // 3. Suscribirse a cambios en game_players
  channel.on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'game_players',
      filter: `room_code=eq.${roomCode}`
    },
    async (payload) => {
      console.log('[v0] Players updated:', payload);
      
      // Recargar lista completa de jugadores
      const { data: players } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_code', roomCode)
        .eq('is_connected', true)
        .order('joined_at', { ascending: true });
      
      set({ players: players || [] });
    }
  );
  
  // 4. Activar suscripción
  channel.subscribe((status) => {
    console.log('[v0] Subscription status:', status);
  });
  
  // 5. Guardar referencia para cleanup
  set({ realtimeChannel: channel });
}
\`\`\`

### 4. Iniciar Partida

**Flujo:**
\`\`\`
Anfitrión → Clic "Iniciar" → Reparte cartas → Actualiza estado → Todos redirigen a /game
\`\`\`

**Código:**
\`\`\`typescript
async startGame() {
  const { roomCode, players } = get();
  
  // 1. Repartir cartas entre jugadores
  const allCards = getAllCards(); // 32 cartas
  const shuffled = shuffleArray(allCards);
  const cardsPerPlayer = Math.floor(shuffled.length / players.length);
  
  // 2. Asignar cartas a cada jugador
  const playerHands = players.map((player, index) => ({
    playerId: player.player_id,
    cards: shuffled.slice(
      index * cardsPerPlayer,
      (index + 1) * cardsPerPlayer
    )
  }));
  
  // 3. Determinar quién inicia (jugador con carta 1A)
  const firstPlayer = determineFirstPlayer(playerHands);
  
  // 4. Actualizar estado de la sala
  await supabase
    .from('game_rooms')
    .update({
      status: 'playing',
      current_turn: firstPlayer,
      game_started_at: new Date().toISOString()
    })
    .eq('room_code', roomCode);
  
  // 5. Actualizar conteo de cartas de cada jugador
  for (const hand of playerHands) {
    await supabase
      .from('game_players')
      .update({ card_count: hand.cards.length })
      .eq('room_code', roomCode)
      .eq('player_id', hand.playerId);
  }
  
  // Nota: Todos los clientes recibirán la actualización via Realtime
  // y redirigirán automáticamente a /game/[code]
}
\`\`\`

---

## Sistema de Detección de Desconexión

### Problema
¿Cómo detectar cuando un jugador cierra la pestaña o pierde conexión?

### Solución: Sistema de Heartbeat

**Concepto:**
- Cada jugador envía una señal de "estoy vivo" cada 5 segundos
- El servidor marca como desconectado a jugadores sin señal por más de 10 segundos
- Se usa un campo `last_heartbeat` en la tabla `game_players`

### Implementación

#### 1. Envío de Heartbeat (Cliente)

\`\`\`typescript
// lib/game-store.ts
startHeartbeat() {
  const { roomCode, playerId } = get();
  
  // Enviar heartbeat cada 5 segundos
  const interval = setInterval(async () => {
    await supabase
      .from('game_players')
      .update({ 
        last_heartbeat: new Date().toISOString(),
        is_connected: true 
      })
      .eq('room_code', roomCode)
      .eq('player_id', playerId);
    
    console.log('[v0] Heartbeat sent');
  }, 5000);
  
  set({ heartbeatInterval: interval });
}

stopHeartbeat() {
  const { heartbeatInterval } = get();
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
}
\`\`\`

#### 2. Detección de Desconexión (Cliente)

\`\`\`typescript
// Verificar jugadores desconectados cada 10 segundos
checkDisconnectedPlayers() {
  const interval = setInterval(async () => {
    const { roomCode } = get();
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    
    // Marcar como desconectados a jugadores sin heartbeat reciente
    await supabase
      .from('game_players')
      .update({ is_connected: false })
      .eq('room_code', roomCode)
      .lt('last_heartbeat', tenSecondsAgo);
    
  }, 10000);
  
  set({ disconnectionCheckInterval: interval });
}
\`\`\`

#### 3. Manejo de Desconexión del Anfitrión

\`\`\`typescript
// En el componente del lobby o juego
useEffect(() => {
  const checkHostConnection = async () => {
    const { data: room } = await supabase
      .from('game_rooms')
      .select('*, game_players!inner(*)')
      .eq('room_code', roomCode)
      .eq('game_players.is_host', true)
      .single();
    
    const host = room?.game_players?.[0];
    
    if (host && !host.is_connected) {
      // El anfitrión se desconectó
      alert('El anfitrión se ha desconectado. El juego ha terminado.');
      router.push('/');
    }
  };
  
  const interval = setInterval(checkHostConnection, 5000);
  return () => clearInterval(interval);
}, [roomCode]);
\`\`\`

#### 4. Cleanup al Desmontar

\`\`\`typescript
// En useEffect del componente
useEffect(() => {
  gameStore.startHeartbeat();
  gameStore.checkDisconnectedPlayers();
  
  return () => {
    gameStore.stopHeartbeat();
    gameStore.markAsDisconnected(); // Marcar como desconectado al salir
  };
}, []);
\`\`\`

### Diagrama de Flujo

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    JUGADOR CONECTADO                         │
│                                                              │
│  Cada 5s: Envía heartbeat → Actualiza last_heartbeat        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  last_heartbeat: 2025-01-17 10:00:05                   │ │
│  │  is_connected: true                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Jugador cierra pestaña
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  JUGADOR DESCONECTADO                        │
│                                                              │
│  Cada 10s: Sistema verifica last_heartbeat                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  last_heartbeat: 2025-01-17 10:00:05 (hace 15s)       │ │
│  │  is_connected: false ← Marcado automáticamente         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  → Contador de jugadores se actualiza                       │
│  → Si es anfitrión: Todos redirigen a página principal      │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## Sistema de Chat en Tiempo Real

### Arquitectura del Chat

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTE DE CHAT                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Botón Flotante (siempre visible)                     │ │
│  │  - Icono de chat                                       │ │
│  │  - Badge con mensajes no leídos                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Panel Deslizable (abre/cierra)                       │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Lista de Mensajes                               │ │ │
│  │  │  - Mensaje propio (derecha, azul)               │ │ │
│  │  │  - Mensaje de otros (izquierda, gris)           │ │ │
│  │  │  - Timestamp                                     │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Input de Mensaje                                │ │ │
│  │  │  [Escribe un mensaje...] [Enviar]               │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Implementación del Chat

#### 1. Componente de Chat

\`\`\`typescript
// components/game-chat.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatMessage {
  id: string
  player_id: string
  player_name: string
  message: string
  created_at: string
}

export function GameChat({ 
  roomCode, 
  playerId, 
  playerName 
}: { 
  roomCode: string
  playerId: string
  playerName: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 1. Cargar mensajes existentes
  useEffect(() => {
    loadMessages()
  }, [roomCode])
  
  // 2. Suscribirse a nuevos mensajes
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          console.log('[v0] New message:', payload.new)
          setMessages(prev => [...prev, payload.new as ChatMessage])
          scrollToBottom()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomCode])
  
  // 3. Auto-scroll al recibir mensajes
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: true })
    
    if (data) setMessages(data)
  }
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return
    
    await supabase
      .from('chat_messages')
      .insert({
        room_code: roomCode,
        player_id: playerId,
        player_name: playerName,
        message: newMessage.trim()
      })
    
    setNewMessage('')
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  return (
    <>
      {/* Botón flotante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
      
      {/* Panel de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Chat del Juego</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.player_id === playerId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-2 ${
                    msg.player_id === playerId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {msg.player_id !== playerId && (
                    <p className="text-xs font-semibold mb-1">{msg.player_name}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe un mensaje..."
            />
            <Button onClick={sendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
\`\`\`

#### 2. Integración en la Página del Juego

\`\`\`typescript
// app/game/[code]/page.tsx
import { GameChat } from '@/components/game-chat'

export default function GamePage({ params }: { params: { code: string } }) {
  const { playerId, playerName, room } = useGameStore()
  
  return (
    <div>
      {/* Contenido del juego */}
      
      {/* Chat flotante (solo visible cuando el juego está en estado 'playing') */}
      {room?.status === 'playing' && (
        <GameChat 
          roomCode={params.code}
          playerId={playerId}
          playerName={playerName}
        />
      )}
    </div>
  )
}
\`\`\`

### Flujo de Mensajes

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      JUGADOR A                               │
│                                                              │
│  1. Escribe mensaje: "Hola!"                                │
│  2. Clic en "Enviar"                                        │
│  3. INSERT en chat_messages                                 │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE REALTIME                          │
│                                                              │
│  1. Detecta INSERT en chat_messages                         │
│  2. Broadcast a todos los suscriptores del canal            │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  JUGADOR B, C, D                             │
│                                                              │
│  1. Reciben evento via WebSocket                            │
│  2. Agregan mensaje a su lista local                        │
│  3. UI se actualiza automáticamente                         │
│  4. Auto-scroll al final                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## Flujo de Datos Completo

### Escenario: Dos jugadores juegan una ronda

\`\`\`
JUGADOR A (Anfitrión)                    SUPABASE                    JUGADOR B
─────────────────────────────────────────────────────────────────────────────

1. Crea sala "ABC123"
   └─> INSERT game_rooms ──────────────────────────────────────────────────>
   └─> INSERT game_players ────────────────────────────────────────────────>

2. Espera en lobby
   └─> Suscribe a canal ───────────────────────────────────────────────────>
   
                                                                3. Ingresa código
                                                                   └─> INSERT game_players
                                                                   └─> Suscribe a canal
                                                                   
   <─────────────────────────── Broadcast: Nuevo jugador ──────────────────┘
   
4. Ve que B se unió
   Actualiza UI: "Jugadores (2/4)"
   
5. Clic "Iniciar Partida"
   └─> UPDATE game_rooms ──────────────────────────────────────────────────>
       (status = 'playing')
       
   <─────────────────────────── Broadcast: Juego iniciado ─────────────────>
                                                                6. Recibe actualización
                                                                   Redirige a /game/ABC123
                                                                   
7. Redirige a /game/ABC123

8. Es su turno, elige atributo "Fuerza"
   └─> INSERT cards_in_play ───────────────────────────────────────────────>
   └─> UPDATE game_rooms ──────────────────────────────────────────────────>
       (selected_attribute = 'fuerza')
       
   <─────────────────────────── Broadcast: Carta jugada ───────────────────>
                                                                9. Recibe actualización
                                                                   Ve carta de A
                                                                   Juega su carta automáticamente
                                                                   └─> INSERT cards_in_play
                                                                   
   <─────────────────────────── Broadcast: Carta jugada ───────────────────┘
   
10. Ve carta de B
    Compara valores
    Determina ganador
    └─> UPDATE game_players ────────────────────────────────────────────────>
        (card_count actualizado)
    └─> DELETE cards_in_play ───────────────────────────────────────────────>
    └─> UPDATE game_rooms ──────────────────────────────────────────────────>
        (current_turn = ganador)
        
   <─────────────────────────── Broadcast: Ronda terminada ────────────────>
                                                                11. Recibe actualización
                                                                    Ve resultado
                                                                    Actualiza conteo
\`\`\`

---

## Implementación Paso a Paso

### Paso 1: Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Obtener credenciales:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Agregar a `.env.local`

### Paso 2: Crear Tablas

Ejecutar scripts SQL en orden:
1. `01-create-tables.sql` - Crea tablas base
2. `02-enable-realtime.sql` - Habilita Realtime
3. `03-add-chat-and-presence.sql` - Agrega chat y heartbeat

### Paso 3: Instalar Dependencias

\`\`\`bash
npm install @supabase/supabase-js zustand
\`\`\`

### Paso 4: Crear Cliente de Supabase

\`\`\`typescript
// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
\`\`\`

### Paso 5: Crear Game Store

\`\`\`typescript
// lib/game-store.ts
import { create } from 'zustand'
import { supabase } from './supabase-client'

interface GameStore {
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
  players: Player[]
  room: Room | null
  
  createRoom: (playerName: string) => Promise<string>
  joinRoom: (roomCode: string, playerName: string) => Promise<void>
  subscribeToRoom: (roomCode: string) => void
  startHeartbeat: () => void
  // ... más funciones
}

export const useGameStore = create<GameStore>((set, get) => ({
  // ... implementación
}))
\`\`\`

### Paso 6: Crear Componentes

1. Página principal (`app/page.tsx`)
2. Lobby (`app/lobby/[code]/page.tsx`)
3. Juego (`app/game/[code]/page.tsx`)
4. Chat (`components/game-chat.tsx`)

### Paso 7: Implementar Suscripciones

En cada componente que necesite datos en tiempo real:

\`\`\`typescript
useEffect(() => {
  gameStore.subscribeToRoom(roomCode)
  gameStore.startHeartbeat()
  
  return () => {
    gameStore.unsubscribe()
    gameStore.stopHeartbeat()
  }
}, [roomCode])
\`\`\`

---

## Código de Ejemplo Completo

### Ejemplo: Crear y Unirse a una Sala

\`\`\`typescript
// Componente de página principal
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/lib/game-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function HomePage() {
  const router = useRouter()
  const { createRoom, joinRoom } = useGameStore()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert('Ingresa tu nombre')
      return
    }
    
    setLoading(true)
    try {
      const code = await createRoom(playerName)
      router.push(`/lobby/${code}`)
    } catch (error) {
      alert('Error al crear sala')
    } finally {
      setLoading(false)
    }
  }
  
  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert('Ingresa tu nombre y el código de sala')
      return
    }
    
    setLoading(true)
    try {
      await joinRoom(roomCode.toUpperCase(), playerName)
      router.push(`/lobby/${roomCode.toUpperCase()}`)
    } catch (error) {
      alert('Error al unirse a la sala')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-4xl font-bold text-center">Card Match Battle</h1>
        
        <div className="space-y-4">
          <Input
            placeholder="Tu nombre"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          
          <Button 
            onClick={handleCreateRoom} 
            disabled={loading}
            className="w-full"
          >
            Crear Partida
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O únete a una partida
              </span>
            </div>
          </div>
          
          <Input
            placeholder="Código de sala"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          
          <Button 
            onClick={handleJoinRoom} 
            disabled={loading}
            variant="outline"
            className="w-full bg-transparent"
          >
            Unirse a Partida
          </Button>
        </div>
      </div>
    </div>
  )
}
\`\`\`

---

## Ventajas y Desventajas

### Ventajas de esta Arquitectura

✅ **Sin servidor personalizado**: No necesitas Node.js, Socket.io, etc.
✅ **Persistencia automática**: Los datos se guardan en PostgreSQL
✅ **Escalabilidad**: Supabase maneja miles de conexiones
✅ **Desarrollo rápido**: Menos código boilerplate
✅ **Costo bajo**: Free tier generoso de Supabase
✅ **Realtime bidireccional**: Cambios en DB → Clientes automáticamente
✅ **Autenticación integrada**: Sistema de auth incluido (opcional)
✅ **Reconexión automática**: Supabase maneja desconexiones
✅ **TypeScript**: Tipos generados automáticamente desde la DB

### Desventajas

❌ **Dependencia de Supabase**: Vendor lock-in
❌ **Latencia**: Puede ser mayor que WebSockets puros optimizados
❌ **Límites del free tier**: 500MB DB, 2GB bandwidth
❌ **Menos control**: No puedes optimizar el protocolo WebSocket
❌ **Curva de aprendizaje**: Necesitas aprender Supabase

### Cuándo Usar Esta Arquitectura

✅ **Usar cuando:**
- Necesitas sincronización en tiempo real
- Quieres desarrollo rápido
- No tienes experiencia con WebSockets
- Necesitas persistencia de datos
- Presupuesto limitado

❌ **NO usar cuando:**
- Necesitas latencia ultra-baja (< 50ms)
- Tienes millones de usuarios concurrentes
- Necesitas control total del protocolo
- Ya tienes infraestructura WebSocket

---

## Conclusión

Este sistema multijugador usa **Supabase Realtime** como capa de abstracción sobre WebSockets, proporcionando:

1. **Sincronización automática** entre todos los clientes
2. **Persistencia** de datos en PostgreSQL
3. **Detección de desconexiones** con sistema de heartbeat
4. **Chat en tiempo real** sin servidor personalizado
5. **Desarrollo rápido** con menos código

La clave está en entender que **Supabase Realtime SÍ usa WebSockets internamente**, pero abstrae toda la complejidad, permitiéndote enfocarte en la lógica de negocio en lugar de la infraestructura.

Para implementar esto en otro proyecto:
1. Configura Supabase
2. Crea las tablas necesarias
3. Habilita Realtime en las tablas
4. Usa `supabase.channel()` para suscribirte a cambios
5. Implementa heartbeat para detección de desconexiones
6. ¡Listo!

---

## Recursos Adicionales

- [Documentación de Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Guía de Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Ejemplos de Supabase](https://github.com/supabase/supabase/tree/master/examples)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

**Autor**: Sistema de IA v0  
**Fecha**: Enero 2025  
**Versión**: 1.0
