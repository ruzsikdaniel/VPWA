import { api } from "src/boot/axios";
import { CHANNELS, SELECTEDCHANNEL, MESSAGES, NICKNAME} from "./globalStates";
import { joinWSChannel } from "./ws";

export function selectChannel(channelId){
    const channel = CHANNELS.value.find((item) => item.id === channelId)
    console.log('channel found: ', channel)
    if (!channel) {
        return
    }

    SELECTEDCHANNEL.value = {
        id: channel.id,
        name: channel.name,
        status: channel.status,
        role: channel.role,
        channelColor: channel.channelColor
    }

    MESSAGES.value = []
    joinWSChannel(channelId)
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