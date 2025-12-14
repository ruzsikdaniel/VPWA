import Message from '#models/message'
import { HttpContext } from '@adonisjs/core/http'

export default class MessageController{
    public async listByChannel({params}: HttpContext){
        const channelId = Number(params.channelId)

        if(!channelId || Number.isNaN(channelId))
            return []

        const messages = await Message.query()
            .where('channel_id', channelId)
            .preload('user')
            .orderBy('created_at', 'asc')

        return messages.map(msg => ({
            id: msg.id,
            channelId: msg.channelId,
            nickname: msg.user.nickname,
            profileColor: msg.user.profileColor,
            msgText: msg.msgText,
            timestamp: msg.createdAt
        }))
    }
}