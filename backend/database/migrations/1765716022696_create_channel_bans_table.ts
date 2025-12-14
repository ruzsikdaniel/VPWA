import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_bans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('channel_id')
        .unsigned()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.boolean('banned_by_admin').defaultTo(false)

      table.timestamp('created_at', { useTz: true })

      table.unique(['channel_id', 'user_id'])

    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}