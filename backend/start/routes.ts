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

import AuthController from '#controllers/auth_controller'
import ChannelsController from '#controllers/channels_controller'
import { KickController } from '#controllers/kick_controller'
import { MemberController } from '#controllers/member_controller'
import MessageController from '#controllers/message_controller'


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
    router.get('get_channels/:nickname', [ChannelsController, 'listForUser']) // GET '/channels/get_channels/:nickname' -> get user's channel list
    router.get('get_users/:channelId', [ChannelsController, 'listUsers'])     // GET '/channels/get_users/:channelId' -> get the list of users in the channel
    router.get('/status/:channelId', [ChannelsController, 'status'])          // GET '/channels/status/:channelId'-> get channel status by channel id
    router.get('/:channelId/messages', [MessageController, 'getMessages'])

    router.post('/', [ChannelsController, 'create'])        // POST '/channels' -> ChannelsController.create() - create a new channel    
    
    router.post('/join', [MemberController, 'join'])      // POST '/channels/join -> MemberController.join() - join or create new channel to join
    router.post('/invite', [MemberController, 'invite'])  // POST '/channels/invite' -> MemberController.invite() - invite user to the channel
    router.post('/revoke', [MemberController, 'revoke'])  // POST '/channels/revoke' -> MemberController.revoke() - revoke membership of user in private channel (as admin)
    router.post('/cancel', [MemberController, 'cancel'])         // POST '/channels/cancel' -> MemberController.cancel() - users leaves the channel, admin deletes channel
    router.post('/quit', [MemberController, 'quit'])      // POST '/channels/quit' -> MemberController.quit() - admin leaves the channel without deletion
    
    router.post('/kick', [KickController, 'kick'])    // POST '/channels/kick' -> KickController.kick() - user gets counted into 3 kicks (ban after 3 kicks), admin kick user immediately

    router.delete('/', [MemberController, 'cancel'])   // DELETE '/channels' -> Leave channel
  })
  .prefix('/channels')

/* --- /messages --- */
router
  .group(() => {
    router.get('/:channelId', [MessageController, 'listByChannel']) // GET messages by channelId
  })
  .prefix('/messages')