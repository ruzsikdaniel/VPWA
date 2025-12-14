<template>
  <div class="channel-bar">
    <h2>Channels</h2>

    <aside class="inner-bar">
      <div class="channel-lists">
        <ul class="channel-invite">
          <li>
            <div v-bind:style="{ backgroundColor: '#555'}">CI</div>
            <div>Invite to new channel</div>
          </li>
        </ul>

        <div v-if="CHANNELS.length === 0" class="q-pa-md text-center text-grey">
          <q-icon name="info" size="lg" class="q-mb-sm" />
          <div>No channels available.</div>
          <div>Create one to get started.</div>
        </div>

        <div v-else>
          <ul class="channels">
          <li
            v-for="channel in CHANNELS"
            :key="channel.id"
            @click="selectChannel(channel.id)"
            :class="{
              active: SELECTEDCHANNEL && SELECTEDCHANNEL.id && SELECTEDCHANNEL.id === channel.id,
            }"
          >
            <div v-bind:style="{ backgroundColor: channel.channelColor, color: checkContrastColor(channel.channelColor) }">
              {{ getInitials(channel.name) }}
            </div>
            <div>{{ channel.name }}</div>
          </li>
          </ul>
        </div>
        
      </div>

      <div class="create-channel">
        <button @click="showPopup = true">
          <div id="create-channel-lg-text">
            Create channel
          </div>
          <div id="create-channel-sm-text">
            +
          </div>
        </button>
      </div>

      <!-- Popup Overlay -->
      <div v-if="showPopup" class="overlay">
        <div class="popup">
          <h3>Create new channel</h3>
          <input type="text" v-model="name" placeholder="New channel name" />

          <div>
            <input type="radio" id="public" value="public" v-model="status" />
            <label for="public">public</label>
            <br />
            <input type="radio" id="private" value="private" v-model="status" />
            <label for="private">private</label>
          </div>

          <br />
          <button @click="handleChannelCreation">Submit</button>
          <button @click="showPopup = false">Cancel</button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import {
  CHANNELS,
  createChannel,
  checkContrastColor,
  getInitials,
  MESSAGES,
  SELECTEDCHANNEL
} from 'src/stores/globalStates'
import { onMounted, ref, watch } from 'vue'
import { refreshChannels, selectChannel } from 'src/stores/channelStore'

const showPopup = ref(false)
const name = ref('')
const status = ref('public')

onMounted(async () => {
  await refreshChannels()

  // channels successfully loaded
  if(CHANNELS.value.length > 0)
    selectChannel(CHANNELS.value[0].id)   // select the first one
})

watch(CHANNELS, (newList) => {
  // no channels → reset UI
  const channel = SELECTEDCHANNEL.value

  if(!newList || newList.length === 0){
    SELECTEDCHANNEL.value = null
    MESSAGES.value = []
    return
  }

  // selected channel removed → choose fallback
  if(channel && !newList.find((ch) => ch.id === channel.id)){
    selectChannel(newList[0].id)
  }
})

async function handleChannelCreation() {
  if (!name.value.trim()) {
    alert('Please enter your name')
    return
  }
  if (!status.value) {
    alert('Please select the option')
    return
  }

  let response = await createChannel(name.value.replace(/\s+/g, ''), status.value) // remove all spaces from channel name before creation

  if (response === 'Channel with this name alredy exists') {
    alert(response)
  }

  // Reset
  name.value = ''
  status.value = 'public'
  showPopup.value = false
}
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup {
  background-color: $primary-bg-1;
  padding: 20px;
  border-radius: 8px;
  min-width: 250px;
  text-align: center;
}

.popup h3 {
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  text-align: center;
}

.popup input[type='text'] {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid $primary;
  background-color: #222;
  color: white;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
}

.popup div {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 15px;
}

.popup div input[type='radio'] {
  accent-color: $primary;
  cursor: pointer;
}

.popup div label {
  font-size: 1rem;
  cursor: pointer;
}

.popup button {
  padding: 8px 16px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  background-color: $primary;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}

.popup button:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.popup button:active {
  transform: translateY(1px);
}

.popup button:last-child {
  background-color: #ccc;
  color: #333;
}

.popup button:last-child:hover {
  background-color: #b3b3b3;
}

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
  display: flex;
  flex-direction: column;
  height: 100%;
}

.channel-lists {
  flex: 1;
  overflow-y: auto;
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

#create-channel-sm-text{
  display: none;
}

@media (max-width: 800px){
  .channel-bar{
    width: 90px;
  }

  li div:nth-child(2){
    display: none;
  }

  .create-channel button{
    width: 60px;
    margin-left: -8px;
  }

  .create-channel{
    bottom: 0.5rem
  }

  #create-channel-lg-text{
    display: none;
  }

  #create-channel-sm-text{
    display: block;
  }
}


</style>
