import { BaseModel, column } from "@adonisjs/lucid/orm";
import { DateTime } from "luxon";

export default class ChannelBan extends BaseModel{
  @column({ isPrimary: true })
  public id!: number

  @column({ columnName: 'channel_id' })
  public channelId!: number

  @column({ columnName: 'user_id' })
  public userId!: number

  @column({ columnName: 'banned_by_admin' })
  public bannedByAdmin!: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime
}