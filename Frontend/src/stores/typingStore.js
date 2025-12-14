import { ref } from "vue"

export const TYPINGUSERS = ref({})


export function updateTyping(data){
    const {channelId, nickname, text} = data

    if(!channelId || !nickname)
        return

    if(!TYPINGUSERS.value[channelId])
        TYPINGUSERS.value[channelId] = {}
    
    if(text === ''){
        delete TYPINGUSERS.value[channelId][nickname]

        if(Object.keys(TYPINGUSERS.value[channelId]).length === 0)
            delete TYPINGUSERS.value[channelId]
    }
    else{
        TYPINGUSERS.value[channelId][nickname] = text
    }
}

export function clearChannelTyping(channelId){
    if(TYPINGUSERS.value[channelId])
        delete TYPINGUSERS.value[channelId]
}