<template>
  <header class="nav-bar">
    <div></div>
    <div class="top-bar-right">
      <div
        class="user-info"
        v-bind:title="`${FIRSTNAME} ${LASTNAME} ${NICKNAME} ${EMAIL}`"
        @click.stop="toggleStatusList"
      >
        <span class="user-label">
          <span class="status-dot" :class="statusClass"></span>
          Logged in: {{ NICKNAME }}
        </span>

        <div v-if="showStatus" class="status-list">
          <div
            v-for="(status, index) in statuses"
            :key="index"
            class="status-item"
            @click.stop="setStatus(status)"
          >
            {{ status }}
          </div>
        </div>
      </div>

      <button v-on:click="logOut">Log Out</button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { onMounted, onBeforeUnmount } from 'vue'
import {
  ISLOGGEDIN,
  FIRSTNAME,
  LASTNAME,
  NICKNAME,
  EMAIL,
  PASSWORD,
  CONFIRMPASSWORD,
  TOKEN,
  PROFILECOLOR,
} from 'src/stores/globalStates'
import { api } from 'boot/axios'

const router = useRouter()

const showStatus = ref(false)
const statuses = ['Online', 'Do Not Disturb', 'Offline']
const currentStatus = ref('Online')

function toggleStatusList() {
  showStatus.value = !showStatus.value
}

function setStatus(status) {
  currentStatus.value = status
  showStatus.value = false
  console.log(`New status: ${status}`)
}

const statusClass = computed(() => {
  switch (currentStatus.value) {
    case 'Online':
      return 'dot-online'
    case 'Do Not Disturb':
      return 'dot-dnd'
    case 'Offline':
      return 'dot-offline'
    default:
      return ''
  }
})

function handleClickOutside(event) {
  const userInfoEl = document.querySelector('.user-info')
  if (userInfoEl && !userInfoEl.contains(event.target)) {
    showStatus.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function logOut() {
  const token = TOKEN.value
  if (!token) return

  try {
    await api.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    FIRSTNAME.value = ''
    LASTNAME.value = ''
    PROFILECOLOR.value = ''
    NICKNAME.value = ''
    EMAIL.value = ''
    PASSWORD.value = ''
    CONFIRMPASSWORD.value = ''
    TOKEN.value = ''
    ISLOGGEDIN.value = false
    router.push('/signin')
  } catch (err) {
    console.error(err)
  }
}
</script>

<style lang="scss" scoped>
/* --- Top bar --- */
.nav-bar {
  height: 60px;
  color: white;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 1rem;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.top-bar-right button {
  border: none;
  color: white;
  border-radius: 50px;
  background-color: transparent;
  width: 75px;
  height: 35px;
  text-decoration: underline;
}

.top-bar-right button:hover {
  font-size: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
}

.user-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}

.user-info {
  position: relative;
  cursor: pointer;
  color: white;
}

.user-info:hover {
  color: rgba(150, 150, 150, 0.95);
}

.status-list {
  position: absolute;
  top: 120%;
  left: 0;
  background-color: rgba(40, 40, 40, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  padding: 0.5rem 0;
  min-width: 150px;
  z-index: 10;
}

.status-item {
  padding: 0.5rem 1rem;
  color: white;
  font-size: 14px;
}

.status-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-online {
  background-color: $profile-green;
}

.dot-dnd {
  background-color: $profile-red;
}

.dot-offline {
  background-color: $profile-grey;
}
</style>
