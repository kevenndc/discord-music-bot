const {prefix} = require('../config.json')

module.exports = {
  name : 'help',
  description : `Digite '/help' para ver a lista de comandos`,
  async execute(msg) {
    const commandList = msg.client.commands
    let commandsStr = 'Lista de comandos:\n'

    commandList.forEach(command => {
      if (command.name !== 'help')
        commandsStr += `\`${prefix}${command.name}\` : ${command.description}\n`
    });

    return msg.channel.send(commandsStr)
  }
}