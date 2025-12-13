import { ref, watch } from 'vue'
import { api } from 'boot/axios'
import { selectChannel } from './channelStore'

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
export const PASSWORD = ref('')
export const CONFIRMPASSWORD = ref('')
export const TOKEN = usePersistentRef('TOKEN')

export const SELECTEDCHANNEL = ref(null)

// Messages from currently selected channel
export const MESSAGES = ref([])

export const CHANNELS = ref([])

export const AVAILABLECOLORS = [
  '#EF4444',
  '#3B82F6',
  '#22C55E',
  '#EC4899',
  '#F97316',
  '#38BDF8',
  '#FACC15',
  '#6B7280',
]

watch(CHANNELS, (newList) => {
  const channel = SELECTEDCHANNEL.value
  if(!channel)
    return

  const channels_exist = newList.some(ch => ch.id === channel.id)
  if(!channels_exist){
    SELECTEDCHANNEL.value = null
    MESSAGES.value = []
  }
})

// Functions
export function getInitials(channelName) {
  if (!channelName) return ''

  let firstLetter = channelName[0] || ''
  let secondLetter = channelName[1] || ''

  for (let i = 1; i < channelName.length; i++) {
    if (channelName[i] === ' ' && channelName[i + 1]) {
      secondLetter = channelName[i + 1]
      break
    }
  }

  return `${firstLetter}${secondLetter}`.toUpperCase()
}

export function checkContrastColor(color_hex){
  if (!color_hex)
    return true

  // console.log(color_hex)

  const color = color_hex.replace('#', '')    // get color hex string without # character
  const r = parseInt(color.substr(0, 2), 16)  // RED - first pair of chars
  const g = parseInt(color.substr(2, 2), 16)  // GREEN - second pair of chars
  const b = parseInt(color.substr(4, 2), 16)  // BLUE - third pair of chars

  const brightness = (0.299*r + 0.587*g + 0.114*b)  // calculate brightness
  
  if (brightness > 186){
    //console.log('message color too bright')
    return "#000"   // color is too bright
  }
  return "#fff"
}

export function selectRandomColor() {
  return AVAILABLECOLORS[Math.floor(Math.random() * AVAILABLECOLORS.length)]
}



export async function createChannel(channelName, channelStatus) {
  let color = selectRandomColor()

  try {
    const payload = {
      name: channelName,
      channelColor: color,
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
      return response.data.message
    } 
    else {
      console.log('Channel created:', response.data)

      const newChannel = response.data

      // Add new channel to the list immediately
      CHANNELS.value.push(newChannel)

      // Auto-select it
      selectChannel(newChannel.id)
    }
  } catch (err) {
    console.error('Error creating channel:', err)
  }
}
