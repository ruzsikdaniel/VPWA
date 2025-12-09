import { ref } from 'vue'
import { io } from 'socket.io-client'
import { MESSAGES, NICKNAME, SELECTEDCHANNEL } from './globalStates'

export const socket = ref(null)

export function createWebSocket(channelId) {
  // Close previous socket if exists
  if (socket.value) {
    socket.value.disconnect()
  }

  // Create socket.io connection
  socket.value = io('http://localhost:3333', {
    transports: ['websocket'],
  })

  socket.value.on('connect', () => {
    console.log('[IO] Connected:', socket.value.id)

  //console.warn('messages: ', MESSAGES.value)

    // Join the channel (room)
    socket.value.emit('joinChannel', channelId)
  })

  // Receive broadcast message
  socket.value.on('message', (data) => {
    console.log('[IO] message received:', data)
    
    if (data.channelId !== SELECTEDCHANNEL.value?.id) 
      return

    MESSAGES.value.push(data)
    console.log('MESSAGES.value', MESSAGES.value)
  })

  socket.value.on('disconnect', () => {
    console.log('[IO] disconnected')
  })
}

export function disconnectWebSocket() {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
}

export function sendWSMessage(data) {
  if (!socket.value) 
    return console.error('Socket not connected')
  
  let channelId = data.channelId
  let msgText = data.msgText

  console.log('message: ', msgText)
  console.log('socket response: ', channelId)
  
  socket.value.emit('message', {
    channelId,
    nickname: NICKNAME.value,
    msgText,
  })
}
