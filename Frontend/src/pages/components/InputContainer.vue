<template>
  <div class="input-container">
    <!-- Command picker dropdown -->
    <div v-if="showCommands" class="command-picker">
      <div
        v-for="(command, index) in filteredCommands"
        :key="command.name"
        :class="['command-item', { active: index === selectedCommandIndex }]"
        @click="handleCommand(command.name)"
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
      :placeholder="$q.screen.lt.sm ? 'Message...' : 'Type your message here...'"
      ref="autoResize"
      v-model="message"
      v-on:input="resizeTextarea"
      v-on:keydown="handleKeydown"
    ></textarea>
    <div style="display: flex; flex-direction: column">
      <div style="flex: 1"></div>
      <!--<button @click="sendMessage">Send</button>-->
      <button @click="handleSend">
        <div class="text-lg">Send</div>
        <div class="text-sm">&gt;</div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import { NICKNAME, SELECTEDCHANNEL, MESSAGES, createChannel } from 'src/stores/globalStates'
import { sendWSMessage, sendTyping, joinWSChannel } from 'src/stores/ws'
import { refreshChannels, selectChannel } from 'src/stores/channelStore'

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
  if (!message.value.startsWith('/')) 
    return []

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
        handleCommand(filteredCommands.value[selectedCommandIndex.value].name)
        //selectCommand(filteredCommands.value[selectedCommandIndex.value])
      }
      return
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
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
          console.error('Error inviting to the channel:', err)
        }
      }
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
        console.error('Error inviting to the channel:', err)
      }
    } else if (!SELECTEDCHANNEL.value) {
      Notify.create({
        message: 'No channel selected',
      })
    } else {
      Notify.create({
        message: 'Command syntax is wrong',
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
  typing()
  if (message.value[0] === '/' && showCommands.value === false) {
    showCommands.value = true
    selectedCommandIndex.value = 0
  } 
  else if (message.value[0] !== '/' && showCommands.value === true) {
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

function typing(){
  if(!SELECTEDCHANNEL.value)
    return
  
    sendTyping(message.value)
}

async function handleSend(){
  const msg = message.value
  console.log('message to send:', msg)
  if(!msg.trim())
    return

  // check if message is command
  if(msg.startsWith('/')){
    console.log('message is a command')
    await handleCommand(msg)
    return
  }
  console.warn('sending message: ', msg)

  sendWSMessage(msg)
  message.value = ""
}

async function handleCommand(input) {
  console.log('input: ', input)

  const words = input.trim().split(' ')
  const keyword = words[0].toLowerCase()

  console.log('words: ', words)
  console.log('keyword: ', keyword)

  switch(keyword){
    case '/list':{
      const channel = SELECTEDCHANNEL.value
      if(!channel || !channel?.id){
        console.log('Error getting list of users, no channel selected')
        break
      }
      const channelId = SELECTEDCHANNEL.value?.id

      console.log('listing...')
      console.log('channelId: ', channelId)
      
      try{
        const response = await api.get(`/channels/get_users/${channelId}`)
        console.log('list users: ', response.data)

        let notification = 'List of users in this channel: '

        for(let i = 0; i < response.data.length; i++){
          notification += `@${response.data[i].nickname} (${response.data[i].role})`

          if(i !== response.data.length - 1)
            notification += ', '
          
        }

        Notify.create({
          message: notification,
        })
      }
      catch (err) {
        console.error('Error getting list of users:', err)
      }
      
      break
    }
    case '/join':{
      console.log('joining...')
      const channelName = words[1]
      let channelType = ''

      // /join channelName private
      if(words[2] == 'private')
        channelType = 'private'

      // /join channelName public || /join channelNane
      else if(words[2] == 'public' || words[2] === undefined)
        channelType = 'public'
      
      // third word is not public or private or none
      else{
        Notify.create({
          message: 'Please enter the correct channel type (private/public)',
        })
        return
      }

      // routes.ts => POST /channels/join => ChannelController.join()
      const response = await api.post('/channels/join', {
        name: channelName,
        status: channelType,
        nickname: NICKNAME.value
      })      

      const channel = response.data.channel

      // join web socket room
      joinWSChannel(channel.id)

      // refresh channel list
      await refreshChannels()
      
      // select channel to join
      selectChannel(channel.id)
      
      break
    }

    case '/invite':{
      console.log('inviting...')
      
      if(words.length > 2){
        Notify.create({
          message: `Please use correct command syntax - /invite <username>`,
        })
        break
      }

      const channel = SELECTEDCHANNEL.value

      if(channel.status === 'private' && channel.role === 'user'){
        Notify.create({
          message: `As a regular user, you can not invite anyone to private channels.`
        })
        break
      }

      if(!channel || !channel.id){
        Notify.create({
          message: `Please enter a channel to invite someone.`
        })
        break
      }
      
      const userToInvite = words[1]
      
      // routes.ts => /channels/invite => ChannelController.invite()
      await api.post('/channels/invite', {
        inviterNickname: NICKNAME.value,
        userNickname: userToInvite,
        channelName: SELECTEDCHANNEL.value.name
      })

      Notify.create({
        message: `Invited user ${userToInvite}`
      })
      break
    }

    case '/revoke':{
      console.log('revoking...')
      let userToRevoke = words[1]

      const channel = SELECTEDCHANNEL.value
      if(channel.role === 'user'){
        Notify.create({
          message: `You cannot revoke membership of anyone as a user`
        })
        break
      }

      if(channel.status === 'public'){
        Notify.create({
          message: `You can only revoke user membership from a private channel`   // defined by assignment
        })
      }

      await api.post('/channels/revoke', {
        adminNickname: NICKNAME.value,
        userNickname: userToRevoke,
        channelId: channel.id
      })

      break
    }

    case '/cancel':{
      
      console.log('cancelling...')
      // any user that leaves the channel

      await api.delete('/channels', {
        data: {
          channelId: SELECTEDCHANNEL.value.id,
          nickname: NICKNAME.value
        }
      })
      break
    }

    case '/quit':{
      
      console.log('quitting...')
      // check if user is admin, then delete the channel
      await api.delete('/channels', {
        data: {
          channelId: SELECTEDCHANNEL.value.id,
          nickname: NICKNAME.value,
        },
      })
      break

    }

    case '/kick':{
      
      console.log('kicking...')
      const userToKick = words[1]
      // TODO: implement backend logic for voting or admin kick 
      console.warn(`Kicking user: ${userToKick}`)
      break
    }

    case '/status':{
      
      console.log('status...')
      if(!SELECTEDCHANNEL.value || !SELECTEDCHANNEL.value.id){
        console.log('Error getting selected channel status, no channel selected')
        return
      }

      try {
        const response = await api.get(`channels/status/${SELECTEDCHANNEL.value.id}`)

        Notify.create({
          message: `Channel ${response.data.name} is ${response.data.status}`,
        })
      } 
      catch (err) {
        console.error('Error getting channel status:', err)
      }
      break
    }

    default:
      console.warn('unknown command:', input)
  }
}

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
    //MESSAGES.value.push(response.data)
    console.log('messages', MESSAGES.value)
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

.text-sm{
  display: none;
}

@media (max-width: 410px) {
  .text-lg{
    display: none;
  }

  .text-sm{
    display: block;
  }
}

</style>
