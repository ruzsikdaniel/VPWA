<template>
  <div class="content">
    <div class="top-bar" v-if="SELECTEDCHANNEL && SELECTEDCHANNEL.id">
      <div class="selected-channel">
        <div v-bind:style="{ backgroundColor: SELECTEDCHANNEL.channelColor, color: checkContrastColor(SELECTEDCHANNEL.channelColor) }">
          {{ getInitials(SELECTEDCHANNEL.name) }}
        </div>
        <div v-if="$q.screen.gt.xs">
          {{ SELECTEDCHANNEL.name }}
        </div>
      </div>

      <div class="typing">User is typing ...</div>

      <div class="leave-channel">
        <button @click="leave()">
          <div v-if="$q.screen.gt.xs">
            Leave
          </div>
          <div v-else>-</div>
        </button>
      </div>
    </div>

    <div v-else class="selected-channel">
      <div>--</div>
      <div>No channel selected</div>
    </div>

    <div class="messages-outer">
      <!--
      <q-infinite-scroll reverse @load="loadMoreMessages" :offset="250" :disable="!hasMoreMessages">
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>

        <div class="messages-container">
          <MessageContainer
            v-for="message in selectedChannel.messages"
            :key="message.id"
            :message="message"
          />
        </div>
      </q-infinite-scroll>
      -->

      <div class="messages-container">
        <MessageContainer 
          v-for="message in safeMessages" 
          :key="message.id"
          :message="message" />
      </div>
    </div>

    <InputContainer />
  </div>
</template>

<script setup>
import MessageContainer from './MessageContainer.vue'
import InputContainer from './InputContainer.vue'
import { watch, computed } from 'vue'
import { api } from 'boot/axios'
import {
  CHANNELS,
  SELECTEDCHANNEL,
  MESSAGES,
  getInitials,
  NICKNAME,
  checkContrastColor
} from 'src/stores/globalStates'

const safeMessages = computed(() => 
  MESSAGES.value.filter(m =>
    m &&
    typeof m === 'object' &&
    m.id && 
    m.nickname &&
    m.profileColor &&
    m.msgText
  )
)

watch(SELECTEDCHANNEL, async (value) => {
  if (!value || !value.id)
    return 
  await loadMessages()
}, {immediate: false})

async function leave() {
  let channelId = SELECTEDCHANNEL.value.id
  let nickname = NICKNAME.value

  try {
    const response = await api.delete('channels/', {
      data: { channelId, nickname },
    })

    const data = response.data

    if (data.status === 200) {
      //alert(data.message)

      // Remove channel from the list
      CHANNELS.value = CHANNELS.value.filter((channel) => channel.id !== channelId)

      // Set selected channel to none after deletion
      SELECTEDCHANNEL.value = null
    } else {
      alert(data.message)
    }
  } catch (err) {
    console.error('Error leaving channel:', err)
  }
}

async function loadMessages() {
  const channelId = SELECTEDCHANNEL.value?.id
  console.log('channelid: ', channelId)
  if(!channelId || isNaN(channelId))
    return
  
  //if (!SELECTEDCHANNEL.value?.id)
  //  return
  
  try {
    const response = await api.get(`messages/${channelId}`)
    MESSAGES.value = response.data

    console.log('response data', response.data)
    console.log('messages', MESSAGES.value)
    

    //console.log(MESSAGES.value)
    //console.log(SELECTEDCHANNEL.value.id)
    //console.log(SELECTEDCHANNEL.value.name)
    //console.log(SELECTEDCHANNEL.value.color)
  } catch (err) {
    console.error('Error loading messages:', err)
  }
}

// const channelStore = useChannelStore()
// const selectedChannel = computed(() => channelStore.selectedChannel)

/* Infinite Scroll */

//const hasMoreMessages = ref(true)
//const currentPage = ref(1)

// Reset pagination when channel changes
/* watch(selectedChannel, () => {
  currentPage.value = 1
  hasMoreMessages.value = true
})

const loadMoreMessages = async (index, done) => {
  if (!selectedChannel.value) {
    done(true)
    return
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const hasMore = currentPage.value < 5

    if (!hasMore) {
      hasMoreMessages.value = false
      done(true)
    } else {
      currentPage.value++
      done() // Continue watching
    }
  } catch (error) {
    console.error('Error loading messages:', error)
    done(true) // Stop on error
  }
}*/
</script>

<style lang="scss" scoped>
/* --- Content area --- */
.content {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;

  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border: 1px $primary solid;

  background: #222227;
  color: #ccc;

  flex: 1;

  display: flex;
  flex-direction: column;
  overflow: hidden;

  padding-bottom: 1rem;
}

.top-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px #777 solid;

  padding: 1rem;
}

/* Selected chanel container */
.selected-channel {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
  gap: 0.5rem;
}

/* Selected chanel profile picture */
.selected-channel div:first-child {
  height: 30px;
  width: 30px;
  border-radius: 6px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 14px;

  background-color: inherit;
}

/* Selected chanel name */
.selected-channel div:nth-child(2) {
  font-weight: bold;
  font-size: 16px;
}

@media (max-width: 601px) {
  .selected-channel, .leave-channel{
    flex: 0 0 30px;
  }

  .leave-channel button{
    padding: 0 0 0.8rem;
  }
}

.typing {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.leave-channel {
  display: flex;
  align-items: center;
  justify-content: end;
  flex: 1;
}

.leave-channel button {
  background-color: rgb(113, 18, 18);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  padding: 0 1.2rem;
  height: 2rem;
}

.leave-channel button:hover {
  background-color: rgba(113, 18, 18, 0.8);
  cursor: pointer;
}

.messages-outer {
  flex: 1;
  display: flex;
  flex-direction: column-reverse;
  overflow-y: auto;
}

.messages-container {
  display: flex;
  flex-direction: column;

  padding-bottom: 1rem;
}
</style>
