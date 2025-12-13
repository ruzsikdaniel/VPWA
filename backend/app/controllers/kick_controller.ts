import ChannelUser from "#models/channel_user"
import KickVote from "#models/kick_vote"
import User from "#models/user"
import { getIO } from "#start/socket"
import { HttpContext } from '@adonisjs/core/http'

export class KickController{
    public async kick({request}: HttpContext){
        const {channelId, voterNickname, targetNickname} = request.only(['channelId', 'voterNickname', 'targetNickname'])

        const voter = await User.findBy('nickname', voterNickname)
        const target = await User.findBy('nickname', targetNickname)

        if(!voter || !target)
            return {status: 403, message: 'User not found'}

        if(voter.id === target.id)
            return {status: 403, message: 'You cannot kick yourself'}
        

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

        if(targetMember.role === 'admin'){
            return {status: 403, message: 'You cannot kick channel admin'}
        }

        if(voterMember.role === 'admin'){
        await targetMember.delete()

        await KickVote.query()
            .where('channel_id', channelId)
            .andWhere('target_user_id', target.id)
            .delete()

        const io = getIO()
        io!.to(String(channelId)).emit('event', {
            type: 'channelUpdate',
            data: {
            action: 'kicked',
            channelId,
            nickname: targetNickname
            }
        })

        return {status: 200, message: 'User kicked by admin'}
        }

        const vote = await KickVote.query()
            .where('channel_id', channelId)
            .andWhere('target_user_id', target.id)
            .andWhere('voter_user_id', voter.id)
            .first()

        if(vote){
        return {status: 403, message: 'You already voted to kick this user'}
        }
        
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
        if(votes >= 3){
            await targetMember.delete()

            await KickVote.query()
                .where('channel_id', channelId)
                .andWhere('target_user_id', target.id)
                .delete()

            const io = getIO()
            io!.to(String(channelId)).emit('event', {
                type: 'channelUpdate',
                data: {
                action: 'kicked',
                channelId,
                nickname: targetNickname
                }
            })

            return {status: 200, message: 'User kicked (3 votes reached)'}
        }

        return {status: 200, message: `Kick vote registered (${votes}`}
    }
}