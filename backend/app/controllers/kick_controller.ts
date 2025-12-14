import ChannelUser from "#models/channel_user"
import KickVote from "#models/kick_vote"
import User from "#models/user"
import { getIO } from "#start/socket"
import { HttpContext } from '@adonisjs/core/http'
import { CHANNEL_ROLE } from "./channels_controller.js"
import Channel from "#models/channel"
import ChannelBan from "#models/channel_ban"

export class KickController{
    public async kick({request}: HttpContext){
        const {channelId, voterNickname, targetNickname} = request.only(['channelId', 'voterNickname', 'targetNickname'])
        
        const voter = await User.findBy('nickname', voterNickname)
        const target = await User.findBy('nickname', targetNickname)
        const channel = await Channel.findBy('id', channelId)

        if(!voter || !target)
            return {status: 403, message: 'User not found'}

        if(voter.id === target.id)
            return {status: 403, message: 'You cannot kick yourself'}

        if(!channel)
            return {status: 403, message: 'Channel does not exist'}
        

        const voterMember = await ChannelUser.query()
            .where('user_id', voter.id)
            .andWhere('channel_id', channelId)
            .first()

        const targetMember = await ChannelUser.query()
            .where('user_id', target.id)
            .andWhere('channel_id', channelId)
            .first()

        if(!voterMember || !targetMember){
            return {status: 403, message: 'User is not in the channel'}
        }

        if(targetMember.role === CHANNEL_ROLE.ADMIN){
            return {status: 403, message: 'You cannot kick channel admin'}
        }

        const io = getIO()

        // kick initiated by admin
        if(voterMember.role === CHANNEL_ROLE.ADMIN){
            await targetMember.delete()

            await KickVote.query()
                .where('channel_id', channelId)
                .andWhere('target_user_id', target.id)
                .delete()
            
            // notify kicked user
            io.to(`user:${targetNickname}`).emit('event', {
                type: 'channelUpdate',
                data: {
                    code: 'KICKED_FROM_CHANNEL_ADMIN',
                    channelId, 
                    channelName: channel.name
                }
            })

            io.to(`user:${voterNickname}`).emit('event', {
                type: 'channelUpdate',
                data: {
                    code: 'KICK_SUCCESS',
                    channelId,
                    targetNickname
                }
            })

            return {status: 200, message: 'User kicked by admin'}
        }

        // kick initiated by user - votekick
        const vote = await KickVote.query()
            .where('channel_id', channelId)
            .andWhere('target_user_id', target.id)
            .andWhere('voter_user_id', voter.id)
            .first()

        if(vote)
            return {code: 'REDUNDANT_KICK'}
        
        await KickVote.create({
            channelId,
            targetUserId: target.id,
            voterUserId: voter.id
        })

        const voteCount = await KickVote.query()
            .where('channel_id', channelId)
            .andWhere('target_user_id', target.id)
            .count('* as total')

        const votes = Number(voteCount[0].$extras.total)

        io!.to(`channel:${channelId}`).emit('event', {
            type: 'channelUpdate',
            data: {
                code: 'KICK_VOTE',
                channelId,
                targetNickname,
                votes
            }
        })

        // votes passed -> target user is kicked
        if(votes >= 3){
            await ChannelBan.firstOrCreate(
                {channelId, userId: target.id,},
                {bannedByAdmin: false}
            )
            
            await targetMember.delete()

            await KickVote.query()
                .where('channel_id', channelId)
                .andWhere('target_user_id', target.id)
                .delete()

            io.to(`user:${targetNickname}`).emit('event', {
                type: 'channelUpdate',
                data: {
                    code: 'KICKED_FROM_CHANNEL_VOTE',
                    channelId,
                    channelName: channel.name
                }
            })

            io!.to(`user:${voterNickname}`).emit('event', {
                type: 'channelUpdate',
                data: {
                    code: 'KICK_SUCCESS',
                    channelId,
                    targetNickname
                }
            })

            return {status: 200, message: 'User kicked (3 votes reached)'}
        }

        return {status: 200, code: 'KICK_VOTE'}
    }
}