import { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelUser from '#models/channel_user'
import User from '#models/user'
import { getIO } from '#start/socket'


// remove from here, make colors centralized for backend
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

export default class ChannelsController {

  public async listForUser({ params }: HttpContext) {
    const nickname = params.nickname
    const user = await User.findByOrFail('nickname', nickname)

    if(!user)
      return {status: 400, message: 'User does not exist'}

    const userChannels = await ChannelUser.query()
      .where('user_id', user.id)
      .preload('channel')

    return userChannels.map((c) => ({
      id: c.channel.id,
      name: c.channel.name,
      channelColor: c.channel.channelColor,
      status: c.channel.status,
      role: c.role,
    }))
  }

  public async listUsers({ params }: HttpContext) {
    const channelId = params.channelId

    const users = await User.query()                                // find all users
      .join('channel_users', 'users.id', 'channel_users.user_id')   // that are channel users
      .where('channel_users.channel_id', channelId)                 // of this specific channel
      .select('users.*', 'channel_users.role')                      // and save their roles also

    return users.map((u) => ({
      nickname: u.nickname,
      role: u.$extras.role,
    }))
  }

  public async create({ request }: HttpContext) {
    const { name, channelColor, status, creatorNickname } = request.only(['name', 'channelColor', 'status', 'creatorNickname',
    ])

    try {
      const channel = await Channel.create({name, channelColor, status})    // create a new channel with specific color and status
      const user = await User.findByOrFail('nickname', creatorNickname)     // find user that is the creator of this channel

      await ChannelUser.create({  // create a new channel user
        userId: user.id,          // with the id of the creator
        channelId: channel.id,    // with the id of the channel
        role: 'admin',            // and the 'admin' role
      })

      return channel
    } 
    catch (err) {
      if (err.code === '23505') {  // unique violation (Postgres)
        return {status: 400, message: 'Channel with this name already exists'}
      }
      return {status: 500, message: 'Error creating channel'}
    }
  }

  public async join({ request }: HttpContext){
    const {name, status, nickname} = request.only(['name', 'status', 'nickname'])

    let channel = await Channel.findBy('name', name)    // pull current channel from DB (if exists)
    let role = 'user'   // default role

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

  public async invite({ request }: HttpContext){
    const {inviterNickname, userNickname, channelName} = request.only(['inviterNickname', 'userNickname', 'channelName',
    ])

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

  public async leave({ request }: HttpContext) {
    const { channelId, nickname } = request.only(['channelId', 'nickname'])

    const user = await User.findByOrFail('nickname', nickname)
    const membership = await ChannelUser
      .query()
      .where('user_id', user.id)
      .andWhere('channel_id', channelId)
      .firstOrFail()

    // USER LEAVES
    if (membership.role === 'user') {
      await membership.delete()

      getIO().to(String(channelId)).emit('event', {
        type: 'channelUpdate',
        data: {action: 'left', channelId, nickname},
      })

      return {status: 200, message: 'You left the channel'}
    }

    // ADMIN DELETES CHANNEL
    if(membership.role === 'admin'){
      await ChannelUser.query().where('channel_id', channelId).delete()
      await Channel.query().where('id', channelId).delete()

      getIO().to(String(channelId)).emit('event',{
        type: 'channelUpdate',
        data: {action: 'deleted', channelId, nickname},
      })

      return {status: 200, message: 'Channel deleted'}
    }

    return {status: 403, message: 'Invalid role'}
  }

  public async status({params}: HttpContext){
    const channel = await Channel.findOrFail(params.channelId)
    return {status: channel.status, name: channel.name}
  }
}
