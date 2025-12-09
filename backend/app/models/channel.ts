import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import ChannelUser from './channel_user.js'
import Message from './message.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({columnName: 'color'})
  declare channelColor: string

  @column()
  declare status: string // public or private

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // RELATIONS
  @hasMany(() => ChannelUser)
  declare channelUsers: HasMany<typeof ChannelUser>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>
}
