import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server } from 'socket.io'
import User from '#models/user'
import Message from '#models/message'
import { Socket } from 'socket.io'

let io: Server | null = null    // Socket.IO instance

app.ready(() => {
  const nodeServer = server.getNodeServer()

  io = new Server(nodeServer, {
    cors: {
      origin: '*',
    },
  })

  console.log('[IOnew] Socket.IO initialized')

  io.on('connection', (socket: Socket) => {
    console.log('Client connected: ', socket.id)

    socket.on('identify', (nickname: string) => {
        socket.join(`user:${nickname}`)
        console.log(`[WS] ${nickname} joined a user room`)
    })

    socket.on('event', async(packet) => {
        const {type, data} = packet

        switch (type){
            case 'joinChannel':
                return handleJoinChannel(socket, data)
            case 'sendMessage':
                return handleSendMessage(socket, data)
            case 'typing':
                return handleTyping(socket, data)
            case 'statusUpdate':
                return handleStatusUpdate(socket, data)
            case 'channelUpdate':
                return handleChannelUpdate(socket, data)
            default:
                console.warn("Unknown event type: ", type)
        }
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id)
    })
  }) 
})

async function handleJoinChannel(socket: Socket, data: any){
    const {channelId} = data
    if(!channelId)
        return

    socket.join(`channel:${channelId}`)
    console.log(`[IO] ${socket.id} joined room ${channelId}`)
}

async function handleSendMessage(socket: Socket, data: any){
    const {channelId, nickname, msgText} = data

    const user = await User.findBy('nickname', nickname)
    if(!user){
        return socket.emit('event', {
            type: 'error',
            data: { message: `User ${nickname} not found.` }
        })
    }

    const message = await Message.create({
        userId: user.id,
        channelId,
        msgText
    })

    console.log('message to be saved: ', message)

    await message.load('user')

    io!.to(`channel:${channelId}`).emit('event', {
        type: 'message',
        data: {
            id: message.id,
            channelId,
            nickname: message.user.nickname,
            profileColor: message.user.profileColor,
            msgText: message.msgText,
            timestamp: message.createdAt
        }
    })

    console.log(`[IOnew] Message sent to channel ${channelId}: `, msgText)
}

async function handleTyping(socket: Socket, data: any){
    const {channelId, nickname, text} = data

    if(!channelId)
        return

    io!.to(`channel:${channelId}`).emit('event', {
        type: 'typing',
        data: {
            channelId, 
            nickname, 
            text
        }
    })
}

async function handleStatusUpdate(socket: Socket, data: any){
    const {nickname, status} = data

    const user = await User.findBy('nickname', nickname)
    if(!user)
        return

    user.status = status
    await user.save()

    io!.emit('event', {
        type: 'statusUpdate',
        data: {
            nickname,
            status
        }
    })

    console.log(`[IOnew] User ${nickname} has status ${status}`)
}

async function handleChannelUpdate(socket: Socket, data: any){
    io!.to(`channel:${data.channelId}`).emit('event', {
        type: 'channelUpdate', 
        data
    })

    console.log('[IOnew] Channel update: ', data)
}

export function getIO(): Server {
  if(!io) 
    throw new Error('Socket.IO not initialized')
  return io
}
