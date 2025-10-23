import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createChannel } from 'src/models/Channel'
import { createMessage } from 'src/models/Message'

export const useChannelStore = defineStore('channel', () => {
  const channels = ref([])
  const selectedChannel = ref(null)

  function loadChannels() {
    channels.value = [
      createChannel({
        id: 'C1',
        ownerId: 'U0',
        name: 'TestChannel1',
        type: 'public',
        color: 'red',
        members: ['U0'],
        messages: [
          createMessage({
            id: 'M1',
            senderId: 'U0',
            channelId: 'C1',
            text: 'This is Channel 1'
          }),
          createMessage({
            id: 'M2',
            senderId: 'U0',
            channelId: 'C1',
            text: 'This is a sample text.'
          })
        ]
      }),

      createChannel({
        id: 'C2',
        ownerId: 'U0',
        name: 'TestChannel2',
        type: 'public',
        color: 'blue',
        members: ['U0'],
        messages: [
          createMessage({
            id: 'M3',   //! change ID value system
            senderId: 'U0',
            channelId: 'C2',
            text: 'This is Channel 2'
          })
        ]
      })
    ]

    selectedChannel.value = channels.value[0]
  }

  function selectChannel(channelId){
    const found = channels.value.find(c => c.id === channelId)
    if (found) {
      selectedChannel.value = found
      console.log('Selected channel:', found)
    } 
  }

  function sendNewMessage(senderId, text){
    if(!selectedChannel.value)
      return

    const newId = 'M' + (selectedChannel.value.messages.length + 1)
    const message = createMessage({
      id: newId,
      senderId,
      channelId: selectedChannel.value.id,
      text
    })
    
    selectedChannel.value.messages.push(message)
    console.log(`Message added to ${selectedChannel.value.name}: `, message)
  }



  return { channels, selectedChannel, loadChannels, selectChannel, sendNewMessage}
})