<template>
    <aside class="ChannelBar">
      <h2>Channels</h2>
      <ul>
        <li v-for="channel in channels" :key="channel.id">
          <div>{{ channel.id }}</div>
          <div>{{ channel.name }}</div>
        </li>
      </ul>
    </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useChannelStore } from 'src/stores/channelStore';

const channelStore = useChannelStore()
const channels = computed(() => channelStore.channels)
</script>

<style lang="scss" scoped>
/* --- Sidebar --- */
.ChannelBar {
  width: 300px;
  color: white;
  display: flex;
  flex-direction: column;
}

.ChannelBar h2 {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 1.5rem;
  height: 60px;
}

.ChannelBar ul {
  background-color: rgba(0, 0, 0, 0.4);

  flex: 1;
  overflow-y: auto;

  padding: 1rem;
  padding-left: 0.5rem;

  margin: 0;
  margin-bottom: 0.5rem;
  margin-left: 0.5rem;

  border: 1px $primary solid;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.ChannelBar li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem;
  border-radius: 10px;
  transition: background-color 0.1s ease;
}

.ChannelBar li:hover {
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.1);
}

.ChannelBar li div:first-child {
  height: 40px;
  width: 40px;
  border-radius: 9px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 18px;
}

.ChannelBar li:nth-child(8n + 1) div:first-child {
  background-color: $profile-red;
}

.ChannelBar li:nth-child(8n + 2) div:first-child {
  background-color: $profile-blue;
}

.ChannelBar li:nth-child(8n + 3) div:first-child {
  background-color: $profile-green;
}

.ChannelBar li:nth-child(8n + 4) div:first-child {
  background-color: $profile-pink;
}

.ChannelBar li:nth-child(8n + 5) div:first-child {
  background-color: $profile-orange;
}

.ChannelBar li:nth-child(8n + 6) div:first-child {
  background-color: $profile-light-blue;
}

.ChannelBar li:nth-child(8n + 7) div:first-child {
  background-color: $profile-yellow;
}

.ChannelBar li:nth-child(8n + 8) div:first-child {
  background-color: $profile-grey;
}
</style>
