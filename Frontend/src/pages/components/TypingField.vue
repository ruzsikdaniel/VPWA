<template>
    <div class="typing-wrapper" v-if="activeTypers.length">
        <div class="typing" @click="toggleOverlay()">
            <template v-if="activeTypers.length === 1">
                {{ activeTypers[0][0] }} is typing…
            </template>
            <template v-else>
                Multiple users are typing…
            </template>
        </div>

        <div class="typing-overlay" v-if="showOverlay">
            <div class="typing-user" v-for="[nickname, text] in activeTypers" :key="nickname">
                <strong>
                    {{ nickname }}
                </strong>
                <span class="draft">
                    {{ text || '...' }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { NICKNAME, SELECTEDCHANNEL } from 'src/stores/globalStates';
import { TYPINGUSERS } from 'src/stores/typingStore';
import { computed, watch } from 'vue';
import { ref } from 'vue';


const showTypers = ref(false)

const showOverlay = ref(false)

const typingMap = computed(() => {
  const channelId = SELECTEDCHANNEL.value?.id
  if(!channelId)
    return {}

  return TYPINGUSERS.value[channelId] || {}
})

const activeTypers = computed(() => {
  return Object.entries(typingMap.value)
    .filter(([nickname]) => nickname !== NICKNAME.value)
})

watch(activeTypers, (list) => {
  if(list.length === 0)
  setTimeout(() => {showTypers.value = false}, 300)
})

function toggleOverlay(){
    showOverlay.value = !showOverlay.value
    console.log(showOverlay.value)
}
</script>


<style scoped>
.typing-wrapper {
  position: relative;
  padding: 0.25rem 0.75rem;
  min-height: 1.5rem;
  flex-shrink: 0;
}

.typing {
  font-size: 0.85rem;
  opacity: 0.8;
  cursor: pointer;
  white-space: nowrap;
}

.typing-overlay {
  position: absolute;
  top: 1.6rem;
  left: 0;
  z-index: 1000;

  background: #1e1e1e;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  max-width: 320px;
}

.typing-user {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.25rem;
}

.typing-user:last-child {
  margin-bottom: 0;
}

.draft {
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>