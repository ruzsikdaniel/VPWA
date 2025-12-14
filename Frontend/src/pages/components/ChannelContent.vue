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

      <div class="typing-container">
        <TypingField />
      </div>


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

      <div class="messages-container" ref="messagesContainer" @scroll="onScroll">
        <MessageContainer 
          v-for="message in MESSAGES" 
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
import TypingField from './TypingField.vue'
import { watch, nextTick, ref } from 'vue'
import { api } from 'boot/axios'
import {
  CHANNELS,
  MESSAGES,
  NICKNAME,
  SELECTEDCHANNEL,
  getInitials
} from 'src/stores/globalStates'
import { checkContrastColor } from 'src/stores/globalStates'
import { loadOlderMessages } from 'src/stores/channelStore'

const messagesContainer = ref(null)

async function onScroll(){
  const el = messagesContainer.value
  if(!el)
    return

  if(el.scrollTop <= 50){
    const prevHeight = el.scrollHeight

    await loadOlderMessages()
    await nextTick()

    const newHeight = el.scrollHeight
    el.scrollTop = newHeight - prevHeight
  }
}

watch(() => MESSAGES.value.length, async (len, prevLen) => {
  const el = messagesContainer.value
  if (!el) return

  // First load → always scroll to bottom
  if (prevLen === 0 && len > 0) {
    await nextTick()
    el.scrollTop = el.scrollHeight
    return
  }

  // New message → scroll only if user is near bottom
  const isNearBottom =
    el.scrollHeight - el.scrollTop - el.clientHeight < 100

  if (isNearBottom) {
    await nextTick()
    el.scrollTop = el.scrollHeight
  }
})


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
      MESSAGES.value = []
    } else {
      alert(data.message)
    }
  } catch (err) {
    console.error('Error leaving channel:', err)
  }
}
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

  position: relative;
  overflow: visible;

  pointer-events: auto;
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

.typing-container{
  pointer-events: auto;
  position: relative;
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
  flex-direction: column;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 8px;
}
</style>
