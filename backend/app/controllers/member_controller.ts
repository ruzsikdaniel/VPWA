import ChannelUser from "#models/channel_user"
import User from "#models/user"
import Channel from "#models/channel"
import { getIO } from "#start/socket"
import { HttpContext } from '@adonisjs/core/http'
import Message from "#models/message"

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

export function selectRandomColor() {
  return AVAILABLECOLORS[Math.floor(Math.random() * AVAILABLECOLORS.length)]
}

export class MemberController{
    
    public async join({request}: HttpContext){
        const {name, status, nickname} = request.only(['name', 'status', 'nickname'])

        let channel = await Channel.findBy('name', name)    // pull current channel from DB (if exists)
        let role = 'user'   // default role

        if(channel && channel.status === 'private'){
        return {status: 403, message: 'Private channel cannot be joined without invitation'}
        }

        // channel does not exist - create channel
        if(!channel){
        // add new channel to DB (otherwise)
        channel = await Channel.create({    
            name, 
            status, 
            channelColor: selectRandomColor()
        }) 
        role = 'admin'    // user created this channel -> set user's role to admin
        }

        // pull joining user from DB
        const user = await User.findByOrFail('nickname', nickname)  

        // add user to channel_users table
        await ChannelUser.firstOrCreate(
            {userId: user.id, channelId: channel.id},
            {role}
        )

        // WebSocket broadcast: event -> 'channelUpdate - joined'
        const io = getIO()
        io!.to(String(channel.id)).emit('event', {
        type: 'channelUpdate',
        data: {
            action: 'joined',
            channelId: channel.id,
            nickname
        }
        })

        return {status: 200, channel}
    } 

    public async invite({request}: HttpContext){
        const {inviterNickname, userNickname, channelName} = request.only(['inviterNickname', 'userNickname', 'channelName'])

        const channel = await Channel.findByOrFail('name', channelName)
        const inviter = await User.findByOrFail('nickname', inviterNickname)
        const user = await User.findByOrFail('nickname', userNickname)

        // Private channel check
        const inviterMembership = await ChannelUser.query().where('user_id', inviter.id).andWhere('channel_id', channel.id).first()

        if (!inviterMembership || inviterMembership.role !== 'admin'){
        return {status: 403, message: 'Only admins can invite to private channels'}
        }

        await ChannelUser.firstOrCreate({
        userId: user.id,
        channelId: channel.id,
        })

        // WS broadcast
        getIO().emit('event', {
        type: 'channelUpdate',
        data: {
            action: 'invited',
            channelId: channel.id,
            nickname: user.nickname,
        },
        })

        return {status: 201, message: 'User invited successfully'}
    } 

    public async revoke({request}: HttpContext){
        const {adminNickname, userNickname, channelId} = request.only(['adminNickname', 'userNickname', 'channelId'])
        
        const channel = await Channel.findOrFail(channelId)
        const admin = await User.findByOrFail('nickname', adminNickname)
        const user = await User.findByOrFail('nickname', userNickname)
    
        const adminMember = await ChannelUser
          .query()
          .where('user_id', admin.id)           //
          .andWhere('channel_id', channelId)    //
          .firstOrFail()                        //
    
        if(adminMember.role !== 'admin'){
          return {status: 403, message: 'Only admin can revoke users'}
        }
    
        // delete the user
        await ChannelUser
          .query()
          .where('user_id', user.id)
          .andWhere('channel_id', channelId)
          .delete()
    
        const io = getIO()
        io!.to(String(channelId)).emit('event', {
          type: 'channelUpdate',
          data: {
            action: 'revoked',
            nickname: userNickname,
            channelId
          }
        })
    
        return {status: 200, message: 'User revoked successfully'}
    }

    public async leave({request}: HttpContext){
        const {channelId, nickname} = request.only(['channelId', 'nickname'])

        const io = getIO()
        const user = await User.findBy('nickname', nickname)
        if(!user)
            return {status: 403, message: 'User not found'}
        
        console.log('user that is leaving', user)

        const member = await ChannelUser.query()
            .where('user_id', user.id)
            .andWhere('channel_id', channelId)
            .firstOrFail()

        console.log('member', member)

        if(!member)
            return { status: 403, message: 'User is not a member of this channel' }

        // USER LEAVES
        if(member.role === 'user'){
            await member.delete()
            console.log(`remove the user from channel ${channelId}`, member)

            io!.to(String(channelId)).emit('event', {
                type: 'channelUpdate',
                data: {
                action: 'left', 
                channelId, 
                nickname
                },
            })

            return {status: 200, message: 'You left the channel'}
        }

        // ADMIN DELETES CHANNEL
        if(member.role === 'admin'){
            await ChannelUser.query()
                .where('channel_id', channelId)
                .delete()

            await Channel.query()
                .where('id', channelId)
                .delete()

            io!.to(String(channelId)).emit('event',{
                type: 'channelUpdate',
                data: {
                action: 'deleted', 
                channelId, 
                nickname
                },
            })

            return {status: 200, message: 'Channel deleted'}
        }

        return {status: 403, message: 'Invalid role'}
    }

    public async quit({ request }: HttpContext){
        const {channelId, nickname} = request.only(['channelId', 'nickname'])

        const io = getIO()
        const user = await User.findBy('nickname', nickname)
        if(!user)
            return {status: 403, message: 'User not found'}

        const member = await ChannelUser.query()
            .where('user_id', user.id)
            .andWhere('channel_id', channelId)
            .first()

        if(!member)
            return { status: 403, message: 'User is not a member of this channel' }

        if(member.role !== 'admin')
            return {status: 403, message: 'User is not the admin of this channel'}

        // DELETE ENTIRE CHANNEL
        await Message.query()               // find every message
            .where('channel_id', channelId)   // inside the channel
            .delete()                         // and delete them from DB

        await ChannelUser.query()           // find all channel users
            .where('channel_id', channelId)   // inside the channel
            .delete()                         // and delete them from DB

        await Channel.query()       // find every channel
            .where('id', channelId)   // that is this channel
            .delete()                 // and delete them

        // WS - broadcast a channelUpdate - deleted event
        io!.to(String(channelId)).emit('event',{
            type: 'channelUpdate',
            data: {
                action: 'deleted', 
                channelId, 
                nickname
            },
        })

        return {status: 200, message: 'Channel deleted'}
    }
}