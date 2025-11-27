<template>
  <div v-if="ISLOGGEDIN" class="layout">
    <!-- Sidebar -->
    <!-- <ChannelBar /> -->

    <!-- Main area -->
    <div class="main">
      <!-- Top bar -->
      <NavBar />

      <!-- Chat / content area -->
      <!-- <ChannelContent /> -->
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
// import ChannelBar from './components/ChannelBar.vue'
import NavBar from './components/NavBar.vue'
// import ChannelContent from './components/ChannelContent.vue'
import { ISLOGGEDIN } from 'src/stores/globalStates'
import { useChannelStore } from 'src/stores/channelStore'

const router = useRouter()
const channelStore = useChannelStore()

console.log('Kanaly: ', channelStore.channels)

// Redirect if not signed in
if (ISLOGGEDIN.value === false) {
  router.push('/signin')
}
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
