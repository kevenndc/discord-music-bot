require('dotenv').config()

//Requests
const Discord = require('discord.js');
const Client = require('./client/Client')
const client = new Client()
const {prefix} = require('./config.json')
const fs = require('fs')
const {parseCommandName} = require('./helpers/MessageParser')

getCommands('./commands')

client.once('ready', () => {
  console.log('Ready!')
})

client.once('reconnecting', () => {
  console.log('Reconnecting...')
})

client.once('disconnect', () => {
  console.log('Disconnect!')
})


//Client will listen no chat messages
client.on('message', async msg => {
  //ignore messages from bots and messages that doesn't start with the prefix
  if (msg.author.bot || !msg.content.startsWith(prefix)) return

  //const serverQueue = client.queue.get(msg.guild.id)
  const commandName = parseCommandName(msg)
  const command = client.commands.get(commandName)

  try {
    //console.log('cheguei aqui')
    await command.execute(msg)
  } catch (error) {
    console.log(error)
    msg.reply(error.message)
  }

})

//Adds each command of 'commands' folder and return
function getCommands(folder) {
  fs.readdirSync(folder).filter(file => file.endsWith('.js')).forEach(file => {
    const command = require(`${folder}/${file}`)
    client.commands.set(command.name, command)
  })
}

client.login(process.env.BOT_TOKEN);