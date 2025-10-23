<template>
  <div class="content">
    <div class="selected-channel" v-if="selectedChannel">
        <div :style="{ backgroundColor: `var(--profile-${selectedChannel.color})`}">
          {{ selectedChannel.id }}
        </div>
        <div>
          {{ selectedChannel.name }}
        </div>
    </div>
    <div v-else class="selected-channel">
      <div>--</div>
      <div>No channel selected</div>
    </div>

    <div class="messages-outer">
      <div class="messages-container">
        <MessageContainer v-for="message in selectedChannel.messages" :key="message.id" :message="message"/>                
      </div>
    </div>
    
    <InputContainer />
  </div>
</template>


<script setup>
import { useChannelStore } from 'src/stores/channelStore';
import MessageContainer from './MessageContainer.vue';
import { computed } from 'vue';
import InputContainer from './InputContainer.vue'

const channelStore = useChannelStore()
const selectedChannel = computed(() => channelStore.selectedChannel)
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

.selected-channel {
  display: flex;
  align-items: center;

  border-bottom: 1px #777 solid;

  gap: 0.5rem;
  padding: 1rem;
}

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

.selected-channel div:nth-child(2) {
  font-weight: bold;
  font-size: 16px;
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