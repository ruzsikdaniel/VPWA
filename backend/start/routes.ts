/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

import Channel from '#models/channel'
import ChannelUser from '#models/channel_user'
import Message from '#models/message'
import User from '#models/user'

import AuthController from '#controllers/auth_controller'

const authController = new AuthController()

/* --- /auth --- */
router
  .group(() => {
    router.post('/register', authController.register.bind(authController))
    router.post('/login', authController.login.bind(authController))
    router.post('/logout', authController.logout.bind(authController)).use(middleware.auth())
  })
  .prefix('/auth')

/* --- /channels --- */
router
  .group(() => {
    // GET '/channels/:nickname' -> get user's channel list
    router.get('/:nickname', async ({ params }) => {
      const user = await User.query().where('nickname', params.nickname).firstOrFail()

      const channels = await Channel.query()
        .join('channel_users', 'channels.id', 'channel_users.channel_id')
        .where('channel_users.user_id', user.id)
        .select('channels.*')

      return channels
    })

    // GET '/channels/status/:channelId'-> get channel status by channel id
    router.get('/status/:channelId', async ({ params }) => {
      const channel = await Channel.query().where('id', params.channelId).firstOrFail()

      return { status: channel.status, name: channel.name }
    })

    // POST '/channels' -> create a new channel
    router.post('/', async ({ request }) => {
      // Get channel data from request
      const { name, color, status } = request.only(['name', 'color', 'status'])

      try {
        // Create the channel
        const channel = await Channel.create({
          name,
          color,
          status,
        })

        const user = await User.query()
          .where('nickname', request.input('creatorNickname'))
          .firstOrFail()

        // Add the creator as admin in channel_users pivot
        await ChannelUser.create({
          userId: user.id,
          channelId: channel.id,
          role: 'admin',
        })

        return channel
      } catch (error) {
        // UNIQUE constraint handling
        const uniqueViolation = error.code === '23505' // Postgres

        if (uniqueViolation) {
          const field = error.constraint

          return {
            status: 400,
            message:
              field === 'channels_name_unique'
                ? 'Channel with this name alredy exists'
                : 'Unique field already exists',
          }
        }

        return { status: 500, message: 'Something went wrong' }
      }
    })

    // POST '/channels/invite' -> Invite user to the channel
    router.post('/invite', async ({ request }) => {
      const { inviterNickname, userNickname, channelName } = request.only([
        'inviterNickname',
        'userNickname',
        'channelName',
      ])

      try {
        // get channel by ChannelName
        const channel = await Channel.query().where('name', channelName).firstOrFail()

        if (channel.status === 'private') {
          // get row from channel_users by InviterNickname and ChannelName
          const inviter = await User.query().where('nickname', inviterNickname).firstOrFail()
          const inviterMembership = await ChannelUser.query()
            .where('user_id', inviter.id)
            .andWhere('channel_id', channel.id)
            .firstOrFail()

          if (inviterMembership.role === 'admin') {
            // invite User to the Channnel by adding row to channel_users
            const user = await User.query().where('nickname', userNickname).firstOrFail()
            await ChannelUser.create({
              userId: user.id,
              channelId: channel.id,
              role: 'user',
            })
            return {
              status: 201,
              message: 'User added successfully',
              user: user.nickname,
              channel: channel.name,
            }
          } else {
            return {
              status: 400,
              message: 'Cant invite because only admins can invite to private channels',
            }
          }
        } else {
          const user = await User.query().where('nickname', userNickname).firstOrFail()
          await ChannelUser.create({
            userId: user.id,
            channelId: channel.id,
            role: 'user',
          })
          return {
            status: 201,
            message: 'User added successfully',
            user: user.nickname,
            channel: channel.name,
          }
        }
      } catch (error) {
        // TODO: if channel or any of the users dont exist send correct error message
        return {
          status: 500,
          message: 'Something went wrong',
        }
      }
    })

    // DELETE '/channels' -> Leave channel
    router.delete('/', async ({ request }) => {
      const { channelId, nickname } = request.only(['channelId', 'nickname'])

      try {
        // Get the user by nickname
        const user = await User.query().where('nickname', nickname).firstOrFail()

        // Get the user's membership in the channel
        const membership = await ChannelUser.query()
          .where('user_id', user.id)
          .andWhere('channel_id', channelId)
          .firstOrFail()

        if (membership.role === 'user') {
          // Normal user leaves channel
          await membership.delete()
          return { status: 200, message: 'You have left the channel' }
        } else if (membership.role === 'admin') {
          // Admin deletes the whole channel
          // Delete all memberships
          await ChannelUser.query().where('channel_id', channelId).delete()
          // Delete the channel
          await Channel.query().where('id', channelId).delete()
          return { status: 200, message: 'Channel deleted successfully' }
        } else {
          return { status: 403, message: 'Invalid role' }
        }
      } catch (error) {
        console.error(error)
        return { status: 500, message: 'Something went wrong' }
      }
    })
  })
  .prefix('/channels')

/* --- /messages --- */
router
  .group(() => {
    // GET messages by chanelId
    router.get('/:channelId', async ({ params }) => {
      return Message.query().where('channelId', params.channelId).orderBy('id', 'asc')
    })

    // POST new message
    router.post('/', async ({ request }) => {
      const { nickname, channel_id, msg_text } = request.only([
        'nickname',
        'channel_id',
        'msg_text',
      ])

      // Find user by nickname
      const user = await User.query().where('nickname', nickname).firstOrFail()

      // Create message
      const message = await Message.create({
        userId: user.id,
        channelId: channel_id,
        msgText: msg_text,
      })

      return message
    })
  })
  .prefix('/messages')

/* Web Socket */

const channelClients: Record<string, Set<any>> = {} // all web socket connections to that channel
router.ws('/channels/:channelId', ({ ws, params }) => {
  const channelId = params.channelId

  // Initialize the set for this channel
  if (!channelClients[channelId]) {
    channelClients[channelId] = new Set()
  }
  channelClients[channelId].add(ws)

  // Log client connection
  console.log(
    `[WS] Client connected to channel ${channelId}. Total clients: ${channelClients[channelId].size}`
  )

  // Send welcome to the new client
  //ws.send(JSON.stringify({ system: true, message: `Connected to channel ${channelId}` }))

  // Handle incoming messages
  ws.on('message', (msg: string) => {
    const payload = JSON.parse(msg)

    // Broadcast to all clients in this channel
    for (const client of channelClients[channelId]) {
      if (client !== ws) {
        // skip sender
        client.send(
          JSON.stringify({
            channelId,
            nickname: payload.nickname,
            msgText: payload.msgText,
            timestamp: new Date().toISOString(),
          })
        )
        console.log(`brodcasting message ${JSON.stringify(payload)}`)
      }
    }
  })

  // Handle client disconnect
  ws.on('close', () => {
    channelClients[channelId].delete(ws)
    console.log(
      `[WS] Client disconnected from channel ${channelId}. Remaining clients: ${channelClients[channelId].size}`
    )
  })
})
