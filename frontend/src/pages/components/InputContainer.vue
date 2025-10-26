<template>
  <div class="input-container">
    <!-- Command picker dropdown -->
    <div v-if="showCommands" class="command-picker">
      <div
        v-for="(command, index) in filteredCommands"
        :key="command.name"
        :class="['command-item', { active: index === selectedCommandIndex }]"
        @click="selectCommand(command)"
        @mouseenter="selectedCommandIndex = index"
      >
        <span class="command-name">{{ command.name }}</span>
        <span class="command-description">{{ command.description }}</span>
      </div>
      <div v-if="filteredCommands.length === 0" class="command-item no-results">
        No commands found
      </div>
    </div>

    <textarea
      rows="1"
      placeholder="Type your message here..."
      ref="autoResize"
      v-model="message"
      v-on:input="resizeTextarea"
      v-on:keydown="handleKeydown"
    ></textarea>
    <div style="display: flex; flex-direction: column">
      <div style="flex: 1"></div>
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useChannelStore } from 'src/stores/channelStore'
import { Notify } from 'quasar'

const channelStore = useChannelStore()
const message = ref('')
const autoResize = ref(null)
const showCommands = ref(false)
const selectedCommandIndex = ref(0)

const availableCommands = [
  { name: '/list', description: 'Show users in this channel' },
  { name: '/help', description: 'Show information' },
  { name: '/clear', description: 'Clear chat history' },
  { name: '/settings', description: 'Open settings' },
]

// Send message on enter, navigate commands with arrow keys
const filteredCommands = computed(() => {
  if (!message.value.startsWith('/')) 
    return []

  const query = message.value.toLowerCase()
  
  return availableCommands.filter((cmd) => cmd.name.toLowerCase().startsWith(query))
})

// Send message on enter
function handleKeydown(e) {
  if (showCommands.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedCommandIndex.value = 
        (selectedCommandIndex.value + 1) % filteredCommands.value.length
    } 
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedCommandIndex.value =
        selectedCommandIndex.value === 0
          ? filteredCommands.value.length - 1
          : selectedCommandIndex.value - 1
    } 
    else if (e.key === 'Enter' && filteredCommands.value.length > 0) {
      e.preventDefault()
      if (filteredCommands.value[selectedCommandIndex.value]) {
        selectCommand(filteredCommands.value[selectedCommandIndex.value])
      }
      return
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function selectCommand(command) {
  message.value = command.name

  if (message.value === '/list') {
    Notify.create({
      message: 'List of users in this channnel: @User1, @User2 ... and you!',
    })
  } else if (message.value === '/help') {
    Notify.create({
      message: '/help',
    })
  } else if (message.value === '/clear') {
    Notify.create({
      message: '/clear',
    })
  } else if (message.value === '/settings') {
    Notify.create({
      message: '/settings',
    })
  }
  
  message.value = ''

  showCommands.value = false
}

watch(message, () => {
  if (message.value[0] === '/' && showCommands.value === false) {
    showCommands.value = true
    selectedCommandIndex.value = 0
  } else if (message.value[0] !== '/' && showCommands.value === true) {
    showCommands.value = false
    console.log('hide commands')
  }
})

// Resize text area when input changes
function resizeTextarea() {
  const el = autoResize.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

onMounted(() => {
  resizeTextarea() // run it when component is mounted to set the initial height

  if (channelStore.channels.length === 0) {
    channelStore.loadChannels()
  }
})

function sendMessage() {
  const text = message.value.trim()
  if (!text) 
    return

  // Handle commands

  channelStore.sendNewMessage('U0', text) //! change to current user's id

  console.log('Sending message: ', message.value)

  // Send notification
  Notify.create({
    message: `You have a new message: ${text}`,
  })

  message.value = ''
  resizeTextarea()
}
</script>

<style lang="scss" scoped>
.input-container {
  display: flex;

  gap: 0.5rem;
  margin: 0 1rem;
  padding: 0.5rem;

  border: 1px solid #777;

  border-radius: 5px;
  min-height: 5rem;

  position: relative;
}

.input-container:focus-within {
  border: 1px solid #aaa;
}

.command-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 0.5rem;
  background-color: #2a2a2a;
  border: 1px solid #555;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
}

.command-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.15s;

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  &:hover,
  &.active {
    background-color: rgba(114, 37, 111, 0.3);
  }

  &.no-results {
    color: #999;
    cursor: default;

    &:hover {
      background-color: transparent;
    }
  }
}

.command-name {
  color: $primary;
  font-weight: 600;
  font-size: 0.95rem;
}

.command-description {
  color: #aaa;
  font-size: 0.85rem;
}

.input-container textarea {
  overflow-y: auto;
  resize: none;

  flex: 1;
  border-radius: 10px;

  border: 1px solid #777;

  background-color: transparent;

  color: #eee;
  max-height: 40vh;
  border: none;
}

.input-container textarea:focus {
  outline: none;
}

.input-container button {
  margin-bottom: 0.95rem;
  padding: 0 1.2rem;

  border-radius: 20px;
  border: none;

  background-color: $primary;
  color: white;

  height: 2rem;

  font-weight: bold;
}

.input-container button:hover {
  background-color: rgba(114, 37, 111, 0.8);
  cursor: pointer;
}
</style>
