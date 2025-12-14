import { api } from "src/boot/axios";
import { CHANNELS, SELECTEDCHANNEL, MESSAGES, NICKNAME, LOADING_MESSAGES, MORE_MESSAGES} from "./globalStates";
import { joinWSChannel } from "./ws";
import { ref } from "vue";

export const CHANNEL_EVENT = ref(null)

export async function selectChannel(channelId){
    const channel = CHANNELS.value.find((item) => item.id === channelId)
    console.log('channel found: ', channel)

    if(!channel)
        return

    if(channel.isInvited)
      channel.isInvited = false

    SELECTEDCHANNEL.value = {
        id: channel.id,
        name: channel.name,
        status: channel.status,
        role: channel.role,
        channelColor: channel.channelColor
    }

    MESSAGES.value = []
    MORE_MESSAGES.value = true
    LOADING_MESSAGES.value = false

    await loadOlderMessages()
    joinWSChannel(channelId)
}

export async function loadOlderMessages(){
  if(LOADING_MESSAGES.value || !MORE_MESSAGES.value)
    return

  LOADING_MESSAGES.value = true

  const oldest = MESSAGES.value[0]
  const cursor = oldest?.id

  const response = await api.get(`/channels/${SELECTEDCHANNEL.value.id}/messages`, {params: {cursor, limit: 30}})
  console.log('response', response.data)
  if(response.data.length === 0)
    MORE_MESSAGES.value = false
  else
    MESSAGES.value.unshift(...response.data)

  LOADING_MESSAGES.value = false
}



export async function refreshChannels(){
  try{
    const response = await api.get(`/channels/get_channels/${NICKNAME.value}`)
    CHANNELS.value = response.data || []
  }
  catch(err){
    console.error('[ChannelBar] error loading channels: ', err)
  }
}