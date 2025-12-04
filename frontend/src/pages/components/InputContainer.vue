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
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import { NICKNAME, SELECTEDCHANNEL, MESSAGES, createChannel } from 'src/stores/globalStates'
import { sendWSMessage } from 'src/stores/ws'

const message = ref('')
const showCommands = ref(false)
const selectedCommandIndex = ref(0)
const autoResize = ref(null)

const availableCommands = [
  { name: '/list', description: 'Show users in this channel' },
  { name: '/join channelName [private]', description: 'Create or join channel' },
  { name: '/status', description: 'Display the status of the channel you are currently in' },
  { name: '/invite nickname', description: 'Invite user to the channel' },
]

// Compute witch commands to show based on input
const filteredCommands = computed(() => {
  if (!message.value.startsWith('/')) return []

  const query = message.value.toLowerCase()

  return availableCommands.filter((cmd) => cmd.name.toLowerCase().startsWith(query))
})

// Send message on enter, navigate commands with arrow keys
function handleKeydown(e) {
  if (showCommands.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedCommandIndex.value = (selectedCommandIndex.value + 1) % filteredCommands.value.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedCommandIndex.value =
        selectedCommandIndex.value === 0
          ? filteredCommands.value.length - 1
          : selectedCommandIndex.value - 1
    } else if (e.key === 'Enter' && filteredCommands.value.length > 0) {
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

// Commands Implementation
async function selectCommand(command) {
  message.value = command.name

  // LIST
  if (message.value === '/list') {
    if (SELECTEDCHANNEL.value && SELECTEDCHANNEL.value.id) {
      try {
        const response = await api.get(`channels/get_users/${SELECTEDCHANNEL.value.id}`)

        let notification = 'List of users in this channel: '

        for (let i = 0; i < response.data.length; i++) {
          notification += `@${response.data[i].nickname} (${response.data[i].role})`

          if (i !== response.data.length - 1) {
            notification += ', '
          }
        }

        Notify.create({
          message: notification,
        })
      } catch (err) {
        console.error('Error getting list of users:', err)
      }
    } else {
      console.log('Error getting list of users, no channel selected')
    }
  }
  // JOIN
  else if (message.value.startsWith('/join')) {
    // split the command into separate words
    const words = message.value.trim().split(/\s+/)

    const channelName = words[1]
    let channelStatus = words[2]

    if (channelStatus === undefined) {
      channelStatus = 'public'
    }

    if (channelName && (channelStatus === 'public' || channelStatus === 'private')) {
      let response = await createChannel(channelName, channelStatus)

      // If channel alredy exists invite yourself to the channel instead of creating it
      if (response === 'Channel with this name alredy exists') {
        const payload = {
          inviterNickname: NICKNAME.value,
          userNickname: NICKNAME.value,
          channelName: channelName,
        }

        try {
          const response = await api.post('/channels/invite', payload)

          // if successful
          if (response.data.status === 201) {
            Notify.create({
              message: `Invited you to the channel: ${response.data.channel}`,
            })

            // Reload the page to display the new channel
            location.reload()
          }
          // if exeption
          else {
            Notify.create({
              message: response.data.message,
            })
          }
        } catch (err) {
          console.error('Error inviting to the channel channel:', err)
        }
      }
    } else {
      Notify.create({
        message: 'Command Syntax is wrong',
      })
    }
  }
  // STATUS
  else if (message.value === '/status') {
    if (SELECTEDCHANNEL.value && SELECTEDCHANNEL.value.id) {
      try {
        const response = await api.get(`channels/status/${SELECTEDCHANNEL.value.id}`)

        Notify.create({
          message: `Channel ${response.data.name} is ${response.data.status}`,
        })
      } catch (err) {
        console.error('Error getting channel status:', err)
      }
    } else {
      console.log('Error getting seleccted channel status, no channel selected')
    }
  }
  // INVITE
  else if (message.value.startsWith('/invite')) {
    // split the command into separate words
    const words = message.value.trim().split(/\s+/)

    const userNickname = words[1]

    if (userNickname && SELECTEDCHANNEL.value && SELECTEDCHANNEL.value.name) {
      const payload = {
        inviterNickname: NICKNAME.value,
        userNickname: userNickname,
        channelName: SELECTEDCHANNEL.value.name,
      }

      try {
        const response = await api.post('/channels/invite', payload)

        // if successful
        if (response.data.status === 201) {
          Notify.create({
            message: `${response.data.user} added to the ${response.data.channel} successfully`,
          })
        }
        // if exeption
        else {
          Notify.create({
            message: response.data.message,
          })
        }
      } catch (err) {
        console.error('Error inviting to th chennel channel:', err)
      }
    } else if (!SELECTEDCHANNEL.value) {
      Notify.create({
        message: 'No channel selected',
      })
    } else {
      Notify.create({
        message: 'Command synta is wrong',
      })
    }
  }
  // OTHER
  else {
    Notify.create({
      message: `No such command: ${message.value}`,
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
})

async function sendMessage() {
  const text = message.value.trim()
  if (!text) return

  // Handle commands if not handled earlier (sending with sent button or no commands matched)
  if (text.startsWith('/')) {
    let command = { name: text }
    selectCommand(command)
    return
  }

  // Send Message
  try {
    const payload = {
      nickname: NICKNAME.value,
      channel_id: SELECTEDCHANNEL.value.id,
      msg_text: text,
    }

    const response = await api.post('/messages', payload)

    console.log('Sending message: ', response.data)

    // Add new message to the list immediately
    MESSAGES.value.push(response.data)

    // Brodecat message to web socket
    sendWSMessage(response.data)
  } catch (err) {
    console.error('Error sending message:', err)
  }

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
