import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createChannel } from 'src/models/Channel'

export const useChannelStore = defineStore('channel', () => {
  const channels = ref([])
  const selectedChannel = ref(null)

  function loadChannels() {
    channels.value = [
      createChannel({
        id: 'C1',
        ownerId: 'test_user1',
        name: 'TestChannel1',
        type: 'public',
        color: 'blue',
        members: ['test_user1'],
        messages: ['test_message1']
      }),

      createChannel({
        id: 'C2',
        ownerId: 'test_user1',
        name: 'TestChannel2',
        type: 'public',
        color: 'red',
        members: ['test_user1'],
        messages: []
      })
    ]

    if(channels.value.length > 0){
      selectedChannel.value = channels.value[0]
    }
  }

  function selectChannel(channelId){
    selectedChannel.value = channelId.value.find(c => c.id === channelId)
  }

  return { channels, selectedChannel, loadChannels, selectChannel}
})