require('dotenv').config()

//Requests
const Discord = require('discord.js');
const {prefix} = require('./config.json')
const ytdl = require('ytdl-core')
const queue = new Map()
const axios = require('axios')
const client = new Discord.Client()

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
  const args = msg.content.substr(msg.content.indexOf(' ') + 1)

  const voiceChannel = msg.member.voiceChannel

  if (!voiceChannel)
    return msg.channel.send('Você precisa estar em uma canal de voz para tocar música!')

  const permissions = voiceChannel.permissionsFor(msg.client.user)

  if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
    return msg.channel.send('Eu preciso de permissão  para me conectar e e falar no canal de voz')


  //console.log(args)

  
  const videoId = await getVideoId(args)

  console.log(`video id = ${videoId}`)

  const songInfo = await ytdl.getInfo(videoId)
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
      var conn = await voiceChannel.join()
      queueConstruct.connection = conn

      play(msg.guild.id, queueConstruct.songs[0])
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

 /**
   * The code below implements the integration with the youtube API
   * If someone passes a song or anuthing between brackets like this [autor - song title]
   * the code below will use whatever is between brackes as a search query in youtube.
   * 
   * The first (and only result) result will be selected and then return the video Id so ytdl can download and the rest of the algorithm can work
   */
async function getVideoId(args) {
  if (!args.startsWith('[')) return args

  const startPos = args.indexOf('[') + 1
  const endPos = args.indexOf(']')
  const ytQuery = args.substring(startPos, endPos)
  let videoId = ''
  //console.log(`query = ${ytQuery}`)

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet,id&maxResults=1&q=${ytQuery}&type=video&key=${process.env.API_KEY}`

  await axios.get(url)
    .then(response => {
      console.log('video id ' + response.data.items[0].id.videoId)
      videoId = response.data.items[0].id.videoId
    })
    .catch(error => {
      console.log(error)
      return
    })
  
    return videoId
}

async function skip(msg, serverQueue) {
  if (!msg.member.voiceChannel)
    return msg.channel.send('Você precisa estar em uma canal de voz para pular músicas!')

  if (!serverQueue)
    return msg.channel.send('Não há músicas para pular!')

  serverQueue.voiceChannel.dispatcher.end()
}

async function stop(msg, serverQueue) {
  if (!msg.member.voiceChannel)
    return msg.channel.send('Você precisa estar em uma canal de voz para para parar a música!')

  serverQueue.songs = []
  serverQueue.connection.dispatcher.end()
}

client.login(process.env.BOT_TOKEN);