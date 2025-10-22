<template>
  <div class="content">
    <div class="selected-channel">
        <div>SC</div>
        <div>Selected Channel</div>
    </div>

    <div class="messages-container" v-for="message in messages" :key="message.id">
      <MessageContainer />                
    </div>
  </div>
</template>


<script setup>
import { useMessageStore } from 'src/stores/messageStore';
import MessageContainer from './MessageContainer.vue';

const messageStore = useMessageStore()
const messages = messageStore.messages
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

  background-color: $profile-green;
}

.selected-channel div:nth-child(2) {
  font-weight: bold;
  font-size: 16px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;

  display: flex;
  flex-direction: column-reverse;

  padding-bottom: 1rem;
}
</style>