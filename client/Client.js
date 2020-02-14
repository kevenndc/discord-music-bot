const {Client, Collection} = require('discord.js')

module.exports = class extends Client {
  constructor() {
    super({
      disableEveryone : true,
      disabledEvents : ['TYPING_START']
    })

    this.queue = new Map()
    this.commands = new Collection()
    
  }
}
