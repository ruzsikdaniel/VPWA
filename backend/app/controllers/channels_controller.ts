import { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelUser from '#models/channel_user'
import User from '#models/user'

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

export const CHANNEL_ROLE = {
    ADMIN: 'admin',
    USER: 'user'
}

export default class ChannelsController {

  public async listForUser({ params }: HttpContext){
    const nickname = params.nickname
    const user = await User.findByOrFail('nickname', nickname)

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

  public async listUsers({params}: HttpContext){
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

  public async create({request}: HttpContext){
    const {name, channelColor, status, creatorNickname} = request.only(['name', 'channelColor', 'status', 'creatorNickname'])

    try{
      const channel = await Channel.create({name, channelColor, status})    // create a new channel with specific color and status
      const user = await User.findByOrFail('nickname', creatorNickname)     // find user that is the creator of this channel

      await ChannelUser.create({  // create a new channel user
        userId: user.id,          // with the id of the creator
        channelId: channel.id,    // with the id of the channel
        role: CHANNEL_ROLE.ADMIN,            // and the 'admin' role
      })

      return channel
    } 
    catch(err){
      if(err.code === '23505')  // unique violation (Postgres)
        return {status: 400, message: 'Channel with this name already exists'}
      
      return {status: 500, message: 'Error creating channel'}
    }
  }

  public async status({params}: HttpContext){
    const channel = await Channel.findOrFail(params.channelId)
    return {status: channel.status, name: channel.name}
  }
}
