import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server } from 'socket.io'
import User from '#models/user'

let io: Server | null = null

app.ready(() => {
  const nodeServer = server.getNodeServer()

  io = new Server(nodeServer, {
    cors: {
      origin: '*',
    },
  })

  console.log('[IO] Socket.IO initialized')

  io.on('connection', (socket) => {
    console.log('[IO] Client connected:', socket.id)

    socket.on('joinChannel', (channelId) => {
      socket.join(String(channelId))
      console.log(`[IO] ${socket.id} joined channel ${channelId}`)
    })

    socket.on('message', async (data) => {
      const { channelId, nickname, msgText } = data

      const user = await User.findBy('nickname', nickname)

      const messagePayload = {
        id: Date.now(),   // sent to FE - requires id attribute but value is irrelevant
        channelId,
        nickname,
        profileColor: user?.profileColor,
        msgText,
        timestamp: new Date().toISOString(),
      }

      io!.to(String(channelId)).emit('message', messagePayload)
    })

    socket.on('disconnect', () => {
      console.log('[IO] Client disconnected:', socket.id)
    })
  })
})

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized')
  return io
}
