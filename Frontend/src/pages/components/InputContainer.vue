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
import { sendWSMessage, sendTyping, joinWSChannel } from 'src/stores/ws'
import { refreshChannels, selectChannel, CHANNEL_EVENT } from 'src/stores/channelStore'
import { NICKNAME, SELECTEDCHANNEL } from 'src/stores/globalStates'

const message = ref('')
const showCommands = ref(false)
const selectedCommandIndex = ref(0)
const autoResize = ref(null)

const AVALIABLE_COMMANDS = [
  { name: '/list', descrtiption: 'List users in channel', roles: ['user', 'admin'] },
  { name: '/join channelName [private]', descrtiption: 'Join existing channel or create new channel', roles: ['user', 'admin'] },
  { name: '/status', descrtiption: 'Show channel status', roles: ['user', 'admin'] },
  { name: '/cancel', descrtiption: 'Leave channel (admin deletes)', roles: ['user', 'admin'] },

  { name: '/invite nickname', descrtiption: 'Invite user to channel', public: true, roles: ['admin'] },
  { name: '/revoke nickname', descrtiption: 'Revoke membership of user (private channel)', roles: ['admin'] },
  { name: '/kick username', descrtiption: 'Kick user (admin kicks immediately)', roles: ['user', 'admin'] },
  { name: '/quit', descrtiption: 'Delete channel', roles: ['admin'] },
]

function getCommands(){
  const channel = SELECTEDCHANNEL.value

  if(!channel){
    return AVALIABLE_COMMANDS.filter(cmd => ['/list', '/join channelName [private]'].includes(cmd.name))
  }

  const role = channel.role
  const status = channel.status   // public / private

  // find all commands applicable to current context (public/private and user/admin)
  return AVALIABLE_COMMANDS.filter(cmd => {
    if(cmd.roles && !cmd.roles.includes(role))  // role of command does not match with role of channel
      return false

    if(status === 'public')     // current channel is public
      if(cmd.public)  return true   // command usable only in public channel
      if(cmd.private) return false  // command usable only in private channel

    if(status === 'private')    // current channel is private
      if(cmd.private && cmd.private.includes(role)) return true // command usable private and has role attached
      if(cmd.public)  return false    // command usable in public

    return true
  })
}

// Compute witch commands to show based on input
const filteredCommands = computed(() => {
  if(!message.value.startsWith('/')) 
    return []

  const query = message.value.slice(1).toLowerCase()

  return getCommands()
    .filter(cmd => cmd.name.startsWith(query))
    .map(cmd => ({
      name: `${cmd.name}`,
      description: cmd.descrtiption
    }))
})

// Send message on enter, navigate commands with arrow keys
function handleKeydown(e) {
  const hasCommands = showCommands.value && filteredCommands.value.length > 0

  if(hasCommands){
    if(e.key === 'ArrowDown'){
      e.preventDefault()
      selectedCommandIndex.value = (selectedCommandIndex.value + 1) % filteredCommands.value.length
    } 
    if(e.key === 'ArrowUp'){
      e.preventDefault()
      selectedCommandIndex.value = (selectedCommandIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
    } 
    if (e.key === 'Enter'){
      e.preventDefault()
      const cmd = filteredCommands.value[selectedCommandIndex.value]
      if(cmd)
        handleCommand(cmd.name)

      return
    }
  }

  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault()
    handleSend()
  }
}

watch(message, () => {
  typing()
  if(message.value.startsWith('/') && !showCommands.value){
    showCommands.value = true
    selectedCommandIndex.value = 0
  } 
  else if(message.value.startsWith('/') && showCommands.value){
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

      if(response.data.code === 'USER_BANNED'){
        // this is used to prompt the USER_BANNED channel event
        console.warn('yoink', response.data)
        CHANNEL_EVENT.value = {code: response.data.code, data: {}}
        console.warn('channel event new', CHANNEL_EVENT.value)
      }

      // trying to join a private channel
      if(response.data.status === 403){
        Notify.create({
          message: response.data.message
        })
        break
      }

      const channel = response.data.channel
      // join web socket room
      joinWSChannel(channel.id)

      // refresh channel list
      await refreshChannels()
      
      // select channel to join
      selectChannel(channel.id)
    
      

      Notify.create({
        message: `Successfully joined channel ${channel.name}`
      })
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
      try{
        await api.post('/channels/invite', {
          inviterNickname: NICKNAME.value,
          targetNickname: userToInvite,
          channelName: SELECTEDCHANNEL.value.name
        })
      }
      catch(err){
        console.warn('invite error', err)
      }
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
        break
      }

      await api.post('/channels/revoke', {
        adminNickname: NICKNAME.value,
        userNickname: userToRevoke,
        channelId: channel.id
      })

      break
    }

    case '/kick':{
      
      console.log('kicking...')
      const userToKick = words[1]
      await api.post('/channels/kick', {
        channelId: SELECTEDCHANNEL.value.id,
        voterNickname: NICKNAME.value,
        targetNickname: userToKick
      })
      
      console.warn(`Kicking user: ${userToKick}`)
      break
    }

    case '/quit':{
      
      console.log('quitting...')
      // check if user is admin, then delete the channel
      await api.post('/channels/quit', {
        channelId: SELECTEDCHANNEL.value.id,
        nickname: NICKNAME.value,
      })
      break

    }

    case '/cancel':{
      
      console.log('cancelling...')
      // any user that leaves the channel
      const channel = SELECTEDCHANNEL.value 
      console.log('channel id', channel.id) 
      console.log('nickname.value', NICKNAME.value)
      await api.post('/channels/cancel', {
        channelId: channel.id,
        nickname: NICKNAME.value
      })
      break
    }

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
