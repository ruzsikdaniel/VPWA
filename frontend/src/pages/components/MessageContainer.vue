<template>
  <div class="message">
    <div class="profile-picture">
      {{ message.senderId }}
    </div>
    <div>
      <div class="username">
        {{ message.senderId }} <!-- user.firstname + user.lastname -->
      </div>
      <div class="message-text">
        {{ message.text }}
      </div>
    </div>
  </div>
</template>


<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

// format date code

</script>

<style lang="scss" scoped>
/* Message */

.message {
  display: flex;
  align-items: start;
  padding: 0.5rem 1rem;  
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.message:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.profile-picture {
  height: 40px;
  width: 40px;
  border-radius: 9px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 18px;

  background-color: $profile-red; // the sender user's color
  margin: 0 0.5rem;
}

.message-container div:nth-child(2) {
  flex: 1;
  overflow: hidden;
  padding-right: 8px;
}

.username {
  color: white;
  font-weight: bold;
}

.message-text {
  word-break: break-word;
}

</style>