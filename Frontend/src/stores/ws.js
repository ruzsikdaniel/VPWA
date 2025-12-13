import { ref, watch } from 'vue'
import { io } from 'socket.io-client'
import { MESSAGES, CHANNELS, NICKNAME, SELECTEDCHANNEL } from './globalStates'
import { api } from 'src/boot/axios'

export const socket = ref(null)


export function initWebSocket() {
  if(socket.value)
    return

  // Create socket.io connection
  socket.value = io('http://localhost:3333', {
    transports: ['websocket'],
  })

  socket.value.on('connect', () => {
    console.log('[WS] Connected:', socket.value.id)
    
    joinAllChannels()

    if(SELECTEDCHANNEL.value?.id){
      joinWSChannel(SELECTEDCHANNEL.value.id)
    }
  })

  watch(CHANNELS, () => {
    if(!socket.value)
      return
    joinAllChannels()
  })

  // Global event listener - type-data
  socket.value.on('event', (packet) => {
    const {type, data} = packet
    console.log('event caught: ', type)
    handleEvent(type, data)
  })

  socket.value.on('disconnect', () => {
    console.log('[WS] Disconnected')
    //* socket.value.disconnect()   // disconnect from socket instead of destroying
  })
}



function handleEvent(type, data){
  switch(type){
    case 'message':
      if(data.channelId === SELECTEDCHANNEL.value?.id)
        MESSAGES.value.push(data) // save the newly sent message locally
      break

    case 'typing':
      console.log('[WS] typing: ', data)
      // TODO typingStore.update ...
      break

    case 'statusUpdate':
      console.log('[WS] user status update: ', data)
      break

    case 'channelUpdate':
      console.log('[WS] channel updated: ', data)
      handleChannelUpdate(data) // handle specific type of channel update
      break
    
    case 'error':
      console.log('[WS] server error: ', data.message)
      break

    default:
      console.warn('[WS] Unknown event type: ', type, data)
  }
}

export function joinAllChannels(){
  const channels = CHANNELS.value
  console.log("[WS] Joining all channels: ", channels)

  channels.forEach(ch => {
    if(ch?.id){
      joinWSChannel(ch.id)
    }
  })
}

export function joinWSChannel(channelId){
  if(!socket.value)
    return

  socket.value.emit('event', {
    type: 'joinChannel',
    data: {channelId}
  })

  console.log('[WS] joined channel: ', channelId)
}

export function sendWSMessage(msgText) {
console.log('currently sending message: ', msgText)

  if (!socket.value) 
    return console.error('Socket not connected')
  
  if(!SELECTEDCHANNEL.value)
    return console.error('No selected channel')

  let channelId = SELECTEDCHANNEL.value.id
  let nickname = NICKNAME.value

  // broadcast a 'sendMessage' event to the socket
  socket.value.emit('event', {
    type: 'sendMessage',
    data: {channelId, nickname, msgText}
  })
}

export function sendTyping(text){
  if(!socket.value || !SELECTEDCHANNEL.value)
    return

  let channelId = SELECTEDCHANNEL.value.id
  let nickname = NICKNAME.value

  // broadcast a 'typing' event to the socket
  socket.value.emit('event', {
    type: 'typing',
    data: {channelId, nickname, text}
  })
}

export function updateStatus(status){
  if(!socket.value)
    return

  let nickname = NICKNAME.value

  // broadcast a 'statusUpdate' event to the socket
  socket.value.emit('event', {
    type: 'statusUpdate',
    data: {nickname, status} 
  })
}

function handleChannelUpdate(data){
  const {action, channelId, nickname} = data

  switch(action){
    case 'joined':
      console.log('[WS] User joined channel: ', nickname)
      api.get(`/channels/get_channels/${NICKNAME.value}`)
        .then(response => {
          CHANNELS.value = response.data
        })
      break

    case 'left':
      console.log('[WS] User left: ', nickname)
      break

    case 'deleted':
      // remove channelId from local channel storage 
      CHANNELS.value = CHANNELS.value.filter(ch => ch.id !== channelId)
      
      if(SELECTEDCHANNEL.value?.id === channelId){
        SELECTEDCHANNEL.value = null
        MESSAGES.value = []
      }
      break

    case 'invited':
      // fetch channel list and push new channel
      console.log('[WS] Channel update: invite')
      api.get(`/channels/get_channels/${NICKNAME.value}`)
        .then(response => {
          CHANNELS.value = response.data
        })
      break

    case 'kicked':
    case 'revoked':
      // TODO refine kicking logic
      CHANNELS.value = CHANNELS.value.filter(ch => ch.id !== channelId)
      
      // empty selected channel and messages
      if(SELECTEDCHANNEL.value?.id === channelId){
        SELECTEDCHANNEL.value = null
        MESSAGES.value = []
      }

      // remove channel from channel list 
      break
  }
  
  console.log('[WS] Channel update applied: ', action)
}