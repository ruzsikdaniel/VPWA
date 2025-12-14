import ChannelUser from "#models/channel_user"
import User from "#models/user"
import Channel from "#models/channel"
import { getIO } from "#start/socket"
import { HttpContext } from '@adonisjs/core/http'
import Message from "#models/message"
import { CHANNEL_ROLE, selectRandomColor } from "./channels_controller.js"
import ChannelBan from "#models/channel_ban"

export class MemberController{
    
    public async join({request}: HttpContext){
        const {name, status, nickname} = request.only(['name', 'status', 'nickname'])

        let channel = await Channel.findBy('name', name)    // pull current channel from DB (if exists)
        let role = CHANNEL_ROLE.USER   // default role

        if(channel && channel.status === 'private'){
            return {status: 403, code: 'PRIVATE_CHANNEL'}
        }

        // channel does not exist - create channel
        if(!channel){
        // add new channel to DB (otherwise)
            channel = await Channel.create({    
                name, 
                status, 
                channelColor: selectRandomColor()
            }) 
            role = CHANNEL_ROLE.ADMIN    // user created this channel -> set user's role to admin
        }

        // pull joining user from DB
        const user = await User.findByOrFail('nickname', nickname)  

        // check is user is banned from the channel
        const ban = await ChannelBan.query()
            .where('channel_id', channel.id)
            .andWhere('user_id', user.id)
            .first()
        
        //! code
        if(ban)
            return{status: 403, code: 'USER_BANNED'}

        // add user to channel_users table
        await ChannelUser.firstOrCreate(
            {userId: user.id, channelId: channel.id},
            {role}
        )

        // WebSocket broadcast: event -> 'channelUpdate - joined'
        const io = getIO()
        io!.to(`channel:${channel.id}`).emit('event', {
            type: 'channelUpdate',
            data: {
                code: 'JOINED_CHANNEL',
                channelId: channel.id,
                nickname
            }
        })

        return {status: 200, code: 'JOINED_CHANNEL', channel}
    } 

    public async invite({request}: HttpContext){
        const {inviterNickname, targetNickname, channelName} = request.only(['inviterNickname', 'targetNickname', 'channelName'])

        const channel = await Channel.findByOrFail('name', channelName)
        const inviter = await User.findByOrFail('nickname', inviterNickname)
        const target = await User.findByOrFail('nickname', targetNickname)

        // Private channel check
        const inviterMembership = await ChannelUser.query().where('user_id', inviter.id).andWhere('channel_id', channel.id).first()
        if(!inviterMembership)
            return {status: 403, code: 'NOT_A_MEMBER'}

        if (channel.status === 'private' && 
            inviterMembership.role !== CHANNEL_ROLE.ADMIN){
            return {status: 403, code: 'ADMIN_ONLY'}
        }

        // check if user about to be invited is banned
        const ban = await ChannelBan.query()
            .where('channel_id', channel.id)
            .andWhere('user_id', target.id)
            .first()

        if(ban){
            // banned user is invited by non-admin
            if(inviterMembership.role !== CHANNEL_ROLE.ADMIN)
                return {status: 403, code: 'USER_BANNED'}
            
            await ban.delete()  // admin lifts ban and proceeds to invite
        }

        await ChannelUser.firstOrCreate({
            userId: target.id,
            channelId: channel.id,
        })

        // WS broadcast
        const io = getIO()

        // notify invited user
        io!.to(`user:${targetNickname}`).emit('event', {
            type: 'channelUpdate',
            data: {
                code: 'INVITED_TO_CHANNEL',
                channelId: channel.id,
                channelName: channel.name
            },
        })

        io!.to(`user:${inviterNickname}`).emit('event', {
            type: 'channelUpdate',
            data: {
                code: 'INVITE_SENT',
                channelId: channel.id,
                channelName: channel.name,
                targetNickname: target.nickname
            },
        })

        return {status: 201, code: 'INVITE_SENT'}
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
          .first()                        //
    
        if(adminMember?.role !== CHANNEL_ROLE.ADMIN)
          return {status: 403, code: 'ADMIN_ONLY'}
    
        // delete the user
        await ChannelUser
          .query()
          .where('user_id', user.id)
          .andWhere('channel_id', channelId)
          .delete()
    
        const io = getIO()

        io!.to(`user:${userNickname}`).emit('event', {
            type: 'channelUpdate',
            data: {
                code: 'REVOKED',
                channelId,
                channelName: channel.name,
                nickname: userNickname,
            }
        })

        io!.to(`channel:${channelId}`).emit('event', {
            type: 'channelUpdate',
            data: {
                code: 'REVOKED',
                channelId,
                nickname: userNickname
            }
        })
    
        return {status: 200, code: 'REVOKED'}
    }

    public async cancel({request}: HttpContext){
        const {channelId, nickname} = request.only(['channelId', 'nickname'])

        const io = getIO()
        const user = await User.findBy('nickname', nickname)
        if(!user)
            return {status: 403, message: 'User not found'}
        
        console.log('user that is leaving', user)

        const member = await ChannelUser.query()
            .where('user_id', user.id)
            .andWhere('channel_id', channelId)
            .first()

        console.log('member', member)

        if(!member)
            return { status: 403, message: 'User is not a member of this channel' }

        // USER LEAVES
        if(member.role === CHANNEL_ROLE.USER){
            await member.delete()
            console.log(`remove the user from channel ${channelId}`, member)

            io!.to(`channel:${channelId}`).emit('event', {
                type: 'channelUpdate',
                data: {
                    code: 'LEFT_CHANNEL', 
                    channelId, 
                    nickname
                },
            })

            return {status: 200, code: 'LEFT_CHANNEL'}
        }

        // ADMIN DELETES CHANNEL
        if(member.role === CHANNEL_ROLE.ADMIN){
            await this.deleteChannel(channelId)
            return {status: 200, code: 'CHANNEL_DELETED'}
        }

        return {status: 403, message: 'Invalid role'}
    }

    public async quit({ request }: HttpContext){
        const {channelId, nickname} = request.only(['channelId', 'nickname'])

        const user = await User.findBy('nickname', nickname)
        if(!user)
            return {status: 403, message: 'User not found'}

        const member = await ChannelUser.query()
            .where('user_id', user.id)
            .andWhere('channel_id', channelId)
            .first()

        if(!member)
            return { status: 403, message: 'User is not a member of this channel' }

        if(member.role !== CHANNEL_ROLE.ADMIN)
            return {status: 403, message: 'User is not the admin of this channel'}

        await this.deleteChannel(channelId)        
        return {status: 200, code: 'CHANNEL_DELETED'}
    }

    private async deleteChannel(channelId: number){
        // find all channel users and save their user information
        const members = await ChannelUser.query().where('channel_id', channelId).preload('user')
        const channel = await Channel.find(channelId)
        const channelName = channel?.name

        // find all channel user inside the channel, and delete them
        await ChannelUser.query().where('channel_id', channelId).delete()                         // and delete them from DB

        // find all messages of the channel, and delete them
        await Message.query().where('channel_id', channelId).delete()  


        // finc this channel in DB and delete it
        await Channel.query().where('id', channelId).delete()


        const io = getIO()

        // tell all users that the channel is deleted
        for(const member of members){
            const nickname = member.user.nickname

            io!.to(`user:${nickname}`).emit('event',{
                type: 'channelUpdate',
                data: {code: 'CHANNEL_DELETED', channelName},
            })
        }

        // alert that the channel is deleted
        io!.to(`channel:${channelId}`).emit('event',{
            type: 'channelUpdate',
            data: {code: 'CHANNEL_DELETED', channelName},
        })
    }
}