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

    public async getMessages({params, request}: HttpContext){
        const channelId = Number(params.channelId)
        const cursor = request.input('cursor')
        const limit = Number(request.input('limit', 30))

        if(!channelId || isNaN(channelId))
            return []

        let query = Message.query()
            .where('channel_id', channelId)
            .preload('user')
            .orderBy('id', 'desc')
            .limit(limit)

        if(cursor)
            query = query.where('id', '<', cursor)

        const messages = await query

        return messages.reverse().map(msg => ({
            id: msg.id,
            channelId: msg.channelId,
            msgText: msg.msgText,
            nickname: msg.user?.nickname ?? 'Unknown',
            profileColor: msg.user?.profileColor ?? '#555',
            timestamp: msg.createdAt
        }))
    }
}