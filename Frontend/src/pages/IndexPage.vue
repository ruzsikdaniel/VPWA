<template>
  <div v-if="ISLOGGEDIN" class="layout">
    <!-- Sidebar -->
    <ChannelBar />

    <!-- Main area -->
    <div class="main">
      <!-- Top bar -->
      <NavBar />

      <!-- Chat / content area -->
      <ChannelContent />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ChannelBar from './components/ChannelBar.vue'
import NavBar from './components/NavBar.vue'
import ChannelContent from './components/ChannelContent.vue'
import { onMounted, watch } from 'vue'
import { initWebSocket } from 'src/stores/ws'
import { CHANNEL_EVENT } from 'src/stores/channelStore'
import { Notify } from 'quasar'
import { ISLOGGEDIN } from 'src/stores/globalStates'
import { NOTIFY_MESSAGES } from 'src/utils/notifyMessages'

const router = useRouter()

watch(CHANNEL_EVENT, (event) => {
  console.warn('event caught', event)
  if(!event || !event.code){
    console.warn('invalid channel event', event)
    return
  }

  const handler = NOTIFY_MESSAGES[event.code]
  if(!handler)
    return

  const message = typeof handler === 'function' ? handler(event.data || []) : handler
  if(!message)
    return

  Notify.create({message})

/*
  switch(event.type){
    case 'invited':
      Notify.create({
        message: `You were invited into channel ${event.channelName}`
      })
      break

    case 'invited_sent':{
      Notify.create({
        message: `You invited ${event.nickname} to channel ${event.channelName}`
      })
      break
    }
/*
    case 'kicked':
    case 'revoked':{
      Notify.create({
        message: `You have been removed from channel ${event.channelName}`
      })
      break
    }

    case 'kick_vote':{
      Notify.create({
        message: `Kick vote registered for user ${event.nickname} (${event.votes}/3)`
      })
      break
    }
    
    case 'kicking':
    case 'revoking':{
      Notify.create({
        message: `You have revoked the membership of ${event.nickname} from this channel`
      })
      break
    }

    case 'deleted':
      break
  }
*/
  CHANNEL_EVENT.value = null
})

// Redirect if not signed in
if (ISLOGGEDIN.value === false) {
  router.push('/signin')
}

onMounted(() => {
  initWebSocket()   // connect to websocket immediately after fully loading the page
})
</script>

<style lang="scss" scoped>
/* --- Layout --- */
.layout {
  display: flex;
  height: 100vh;
  background: radial-gradient(circle at top left, $primary-bg-1, $primary-bg-2);
}

/* --- Main area --- */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}
</style>
