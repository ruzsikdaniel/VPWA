<template>
  <div class="channel-bar">
    <h2>Channels</h2>

    <aside class="inner-bar">
      <ul class="channel-invite">
        <li>
          <div v-bind:style="{ backgroundColor: `var(--profile-green)` }">CI</div>
          <div>Invite to new channel</div>
        </li>
      </ul>

      <ul class="channels">
        <li
          v-for="channel in CHANNELS"
          :key="channel.id"
          @click="select(channel.id)"
          :class="{ active: SELECTEDCHANNEL.id === channel.id }"
        >
          <div v-bind:style="{ backgroundColor: `var(--profile-${channel.color})` }">
            {{ getProfileText(channel.name) }}
          </div>
          <div>{{ channel.name }}</div>
        </li>
      </ul>

      <div class="create-channel">
        <button @click="createChannel()">Create channel</button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { api } from 'boot/axios'
import { NICKNAME, SELECTEDCHANNEL, getProfileText, CHANNELS } from 'src/stores/globalStates'
import { onMounted, ref } from 'vue'
import { createWebSocket, disconnectWebSocket } from 'src/stores/ws'

onMounted(async () => {
  await loadChannels()
})

async function loadChannels() {
  try {
    const response = await api.get(`channels/${NICKNAME.value}`)
    CHANNELS.value = response.data
    select(CHANNELS.value[0].id)

    console.log(CHANNELS.value)
  } catch (err) {
    console.error('Error loading channels:', err)
  }
}

function select(channelId) {
  disconnectWebSocket()
  SELECTEDCHANNEL.value = CHANNELS.value.find((item) => item.id === channelId)

  if (SELECTEDCHANNEL.value.id) {
    createWebSocket(SELECTEDCHANNEL.value.id)
  } else {
    console.log('error connectiong websocket')
  }
}

const name = ref('my channel')
const color = ref('red')
const status = ref('public')

async function createChannel() {
  try {
    const payload = {
      name: name.value,
      color: color.value,
      status: status.value,
      creatorNickname: NICKNAME.value,
    }

    const response = await api.post('/channels', payload)

    console.log('Channel created:', response.data)

    // Add new channel to the list immediately
    CHANNELS.value.push(response.data)

    // Auto-select it
    select(response.data.id)

    // Optional: redirect or update list
  } catch (err) {
    console.error('Error creating channel:', err)
  }
}

// import { useChannelStore } from 'src/stores/channelStore'

// const channelStore = useChannelStore()
// const channels = computed(() => channelStore.channels)
// const selectedChannel = computed(() => channelStore.selectedChannel)

/* function select(channelId) {
  channelStore.selectChannel(channelId)
}*/
</script>

<style lang="scss" scoped>
/* --- Sidebar --- */
.channel-bar {
  width: 300px;
  color: white;
  display: flex;
  flex-direction: column;
}

.channel-bar h2 {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 1.5rem;
  height: 60px;
}

.inner-bar {
  background-color: rgba(0, 0, 0, 0.4);

  flex: 1;
  overflow-y: auto;

  margin: 0;
  margin-bottom: 0.5rem;
  margin-left: 0.5rem;

  border: 1px $primary solid;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;

  position: relative; /* Makes this the reference for absolute positioning of the button */
}

.channel-invite {
  margin: 0 0;
  padding: 1rem;
  padding-left: 0.5rem;
  border-bottom: 1px $primary solid;
}

.channels {
  margin: 0 0;
  padding: 1rem;
  padding-left: 0.5rem;
}

li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem;
  border-radius: 10px;
  transition: background-color 0.1s ease;
}

li:hover {
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.1);
}

li.active {
  background-color: $primary;
}

li div:first-child {
  height: 40px;
  width: 40px;
  border-radius: 9px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 18px;
}

/* 
.channel-bar li:nth-child(8n + 1) div:first-child {
  background-color: var(--profile-red);
}

.channel-bar li:nth-child(8n + 2) div:first-child {
  background-color: $profile-blue;
}

.channel-bar li:nth-child(8n + 3) div:first-child {
  background-color: $profile-green;
}

.channel-bar li:nth-child(8n + 4) div:first-child {
  background-color: $profile-pink;
}

.channel-bar li:nth-child(8n + 5) div:first-child {
  background-color: $profile-orange;
}

.channel-bar li:nth-child(8n + 6) div:first-child {
  background-color: $profile-light-blue;
}

.channel-bar li:nth-child(8n + 7) div:first-child {
  background-color: $profile-yellow;
}

.channel-bar li:nth-child(8n + 8) div:first-child {
  background-color: $profile-grey;
}
  */

.create-channel {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 1rem;

  position: absolute; /* Fixed relative to .inner-bar */
  bottom: 1rem; /* distance from bottom of container */
  left: 0;
}

.create-channel button {
  background-color: rgb(0, 60, 0);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  padding: 0 1.2rem;
  height: 2rem;
}

.create-channel button:hover {
  background-color: rgba(0, 60, 0, 0.8);
  cursor: pointer;
}
</style>
