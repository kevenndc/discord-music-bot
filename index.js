require('dotenv').config()

//Requests
const Discord = require('discord.js');
const {prefix} = require('./config.json')
const ytdl = require('ytdl-core')
const queue = new Map()

const client = new Discord.Client();
client.login(process.env.BOT_TOKEN)

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

  // const select = {
  //   'play' : execute(msg, serverQueue),
  //   'skip' : skip(msg, serverQueue),
  //   'stop' : stop(msg, serverQueue)
  // }

  const serverQueue = queue.get(msg.guild.id)

  if (msg.content.startsWith(prefix + 'play')) {
    // const song = await execute(msg)
    // msg.channel.send(`Nome da música: ${song.title}`)
    execute(msg, serverQueue)

  } else if (msg.content.startsWith(prefix + 'skip')) {
    skip(msg, serverQueue)

  } else if (msg.content.startsWith(prefix + 'stop')) {
    stop(msg, serverQueue)

  } else {
    msg.channel.send('Não entendi seu comando :(')
  }

})

async function execute(msg, serverQueue) {
  const args = msg.content.split(' ')

  const voiceChannel = msg.member.voiceChannel

  if (!voiceChannel)
    return msg.channel.send('Você precisa estar em uma canal de voz para tocar música!')

  const permissions = voiceChannel.permissionsFor(msg.client.user)

  if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
    return msg.channel.send('Eu preciso de permissão  para me conectar e e falar no canal de voz')

  const songInfo = await ytdl.getInfo(args[1])
  //console.log('retornou')
  const song = {
    title : songInfo.title,
    url : songInfo.video_url
  }

  if (!serverQueue) {
    const queueConstruct = {
      textChannel : msg.channel,
      voiceChannel : voiceChannel,
      connection : null,
      volume : 5,
      songs : [],
      playing : true
    }

    queue.set(msg.guild.id, queueConstruct)
    queueConstruct.songs.push(song)

    try {
      let conn = await voiceChannel.join()
      queueConstruct.connection = conn

      play(msg.guild, queueConstruct.songs[0])
    } catch (error) {
      console.log(error)
      queue.delete(msg.guild.id)
      return msg.channel.send(error)
    }

  } else {
    serverQueue.songs.push(song)
    console.log(serverQueue.songs)

    return msg.channel.send(`${song.title} foi adicionado à fila de reprodução.`)
  }

  //return song
  
}

function play(guildID, song) {
  const serverQueue = queue.get(guildID)

  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guildID)

    return
  }

  const dispatcher = serverQueue.connection.playStream(ytdl(song.url, {filter : 'audioonly'}))
    .on('end', () => {
      console.log('A música terminou!')
      serverQueue.songs.shift()
      play(guildID, serverQueue.songs[0])
    })
    .on('error', err => {
      console.log(err)
    })

  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
}

async function skip(msg, serverQueue) {
  if (!voiceChannel)
    return msg.channel.send('Você precisa estar em uma canal de voz para tocar música!')

  if (!serverQueue)
    return msg.channel.send('Não há músicas para pular!')

  serverQueue.voiceChannel.dispatcher.end()
}

async function stop(msg, serverQueue) {
  if (!voiceChannel)
    return msg.channel.send('Você precisa estar em uma canal de voz para tocar música!')

  serverQueue.songs = []
  serverQueue.connection.dispatcher.end()
}