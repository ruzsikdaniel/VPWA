import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createMessage } from 'src/models/Message'

export const useMessageStore = defineStore('message', () => {
  const messages = ref([])

  function loadMessages() {
    messages.value = [
      createMessage({
        id: 'M0',
        senderId: 'U0',
        channelId: 'C1',
        text: 'This is a sample text in channel 1.',
        timestamp: '2025-10-15T23:37:18Z',
        recipientId: null
      })
    ]
  }
  return { messages, loadMessages }
})