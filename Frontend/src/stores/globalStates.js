import { ref, watch } from 'vue'
import { createWebSocket, disconnectWebSocket } from 'src/stores/ws'
import { api } from 'boot/axios'

// Persist values on page refresh so it doesnt log u out
function usePersistentRef(key, defaultValue = '') {
  const data = ref(localStorage.getItem(key) || defaultValue)
  watch(data, (val) => {
    localStorage.setItem(key, val)
  })
  return data
}

function usePersistentRefBoolean(key, defaultValue = false) {
  const stored = localStorage.getItem(key)
  const data = ref(stored === 'true' ? true : stored === 'false' ? false : defaultValue)
  watch(data, (val) => localStorage.setItem(key, val))
  return data
}

export const ISLOGGEDIN = usePersistentRefBoolean('ISLOGGEDIN', false)

// Global state
export const FIRSTNAME = usePersistentRef('FIRSTNAME')
export const LASTNAME = usePersistentRef('LASTNAME')
export const PROFILECOLOR = usePersistentRef('PROFILECOLOR')
export const EMAIL = usePersistentRef('EMAIL')
export const NICKNAME = usePersistentRef('NICKNAME')
export const PASSWORD = ref([])
export const CONFIRMPASSWORD = ref([])
export const TOKEN = usePersistentRef('TOKEN')

export const SELECTEDCHANNEL = usePersistentRef('SELECTEDCHANNEL', null)

// Messages from currently selected channel
export const MESSAGES = ref([])

export const CHANNELS = ref([])

export const AVAILABLECOLORS = [
  'red',
  'blue',
  'green',
  'pink',
  'orange',
  'light-blue',
  'yellow',
  'grey',
]

// Functions
export function getProfileText(chanelName) {
  if (!chanelName) return ''

  let firstLetter = chanelName[0] || ''
  let secondLetter = chanelName[1] || ''

  for (let i = 1; i < chanelName.length; i++) {
    if (chanelName[i] === ' ' && chanelName[i + 1]) {
      secondLetter = chanelName[i + 1]
      break
    }
  }

  return `${firstLetter}${secondLetter}`.toUpperCase()
}

export function selectRandomColor() {
  return AVAILABLECOLORS[Math.floor(Math.random() * AVAILABLECOLORS.length)]
}

export function selectChannel(channelId) {
  disconnectWebSocket()
  SELECTEDCHANNEL.value = CHANNELS.value.find((item) => item.id === channelId)

  if (SELECTEDCHANNEL.value.id) {
    createWebSocket(SELECTEDCHANNEL.value.id)
  } else {
    console.log('error connectiong websocket')
  }
}

export async function createChannel(channelName, channelStatus) {
  let color = selectRandomColor()

  try {
    const payload = {
      name: channelName,
      color: color,
      status: channelStatus,
      creatorNickname: NICKNAME.value,
    }

    const response = await api.post('/channels', payload)

    if (
      response.data.status &&
      response.data.status !== 200 &&
      response.data.status !== 'public' &&
      response.data.status !== 'private'
    ) {
      alert(response.data.message)
    } else {
      console.log('Channel created:', response.data)

      // Add new channel to the list immediately
      CHANNELS.value.push(response.data)

      // Auto-select it
      selectChannel(response.data.id)
    }
  } catch (err) {
    console.error('Error creating channel:', err)
  }
}
