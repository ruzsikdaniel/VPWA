<template>
    <div class="input-container">
        <textarea
            rows="1"
            placeholder="Type your message here..."
            ref="autoResize"
            v-model="message"
            v-on:input="resizeTextarea"
        ></textarea>
        <div style="display: flex; flex-direction: column">
            <div style="flex: 1"></div>
            <button @click="sendMessage">Send</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useChannelStore } from 'src/stores/channelStore';

const message = ref('')
const autoResize = ref(null)

function resizeTextarea() {
  const el = autoResize.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

onMounted(() => {
  resizeTextarea() // run it when component is mounted to set the initial height

    const channelStore = useChannelStore()
  if(channelStore.channels.length === 0) {
    channelStore.loadChannels()
  }
})

function sendMessage(){
    if(message.value.trim() === '')
        return

    console.log('Sending message: ', message.value)
    message.value = ''
}

</script>

<style lang="scss" scoped>
/* --- Input container --- */
.input-container {
  display: flex;

  gap: 0.5rem;
  margin: 0 1rem;
  padding: 0.5rem;

  border: 1px solid #777;

  border-radius: 5px;
  min-height: 5rem;
}

.input-container:focus-within {
  border: 1px solid #aaa;
}

.input-container textarea {
  overflow-y: auto;
  resize: none;

  flex: 1;
  border-radius: 10px;

  border: 1px solid #777;

  background-color: transparent;

  color: #eee;
  max-height: 40vh;
  border: none;
}

.input-container textarea:focus {
  outline: none;
}

.input-container button {
  margin-bottom: 0.95rem;
  padding: 0 1.2rem;

  border-radius: 20px;
  border: none;

  background-color: $primary;
  color: white;

  transition: background-color 0.2s ease;

  height: 2rem;

  font-weight: bold;
}

.input-container button:hover {
  opacity: 0.9;
  cursor: pointer;
}
</style>