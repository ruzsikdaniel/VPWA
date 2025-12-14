<template>
  <div class="message">
    <div class="profile-picture" 
      :style="{
        backgroundColor: message?.profileColor || '#555', 
        color: checkContrastColor(message?.profileColor || '#555')
      }"
    >
      {{ getInitials(message?.nickname || '?') }}
    </div>
    <div>
      <div class="username">
        {{ message?.nickname || 'Unknown'}}
      </div>
      <div class="message-text" v-html="highlight(message?.msgText)"></div>
    </div>
  </div>
</template>

<script setup>
import { checkContrastColor, getInitials } from 'src/stores/globalStates'

const highlight = (text) => {
  if(!text || typeof text !== "string")
    return ""

  let result = text.replace(/\B@(\w+)/g, (match, user) => `<span class="highlight">@${user}</span>`)

  return result
}

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

console.log(props)  // user props so ESLint does not complain
</script>

<style lang="scss" scoped>
/* Message */

.message {
  display: flex;
  align-items: start;
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
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

<style lang="scss">
.highlight {
  background-color: rgba(75, 231, 255, 0.2);
  color: rgb(0, 200, 255);
  padding: 0.1rem;
  border-radius: 3px;
}

.highlight:hover {
  background-color: rgba(75, 231, 255, 0.3);
}
</style>
