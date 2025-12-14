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

const router = useRouter()

watch(CHANNEL_EVENT, (event) => {
  if(!event)
    return

  switch(event.type){
    case 'invited':
      break

    case 'kicked':
    case 'revoked':
      Notify.create({
        message: `You have been removed from channel ${event.channelName}`
      })
      break

    case 'deleted':
      break
  }

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
