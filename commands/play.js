const ytdl = require('ytdl-core')
const axios = require('axios')

module.exports = {
  name : 'play',
  async execute(msg) {
    try {
      const args = msg.content.substr(msg.content.indexOf(' ') + 1)
      const queue = msg.client.queue
      const serverQueue = queue.get(msg.guild.id)
      const voiceChannel = msg.member.voiceChannel
      let videoId = ''

      if (!voiceChannel)
        return msg.channel.send('Você precisa estar em uma canal de voz para tocar música!')

      const permissions = voiceChannel.permissionsFor(msg.client.user)

      if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
        return msg.channel.send('Eu preciso de permissão  para me conectar e e falar no canal de voz')

      try {
        videoId = await this.getVideoId(args)
      } catch (error) {
        throw error
      }
      
      const songInfo = await ytdl.getInfo(videoId)

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
          msg.channel.send('Boa tarde 👍')
          queueConstruct.connection = conn

          this.play(msg, queueConstruct.songs[0])
        } catch (error) {
          queue.delete(msg.guild.id)
          return msg.channel.send(error)
        }

      } else {
        serverQueue.songs.push(song)
        console.log(serverQueue.songs)

        return msg.channel.send(`${song.title} foi adicionado à fila de reprodução.`)

        //return song
    
      }
    } catch (error) {
      throw error
    }
  },

  play(msg, song) {
    const queue = msg.client.queue
    const serverQueue = queue.get(msg.guild.id)
  
    if (!song) {
      serverQueue.voiceChannel.leave()
      queue.delete(msg.guild.id)
  
      return
    }
  
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url, {filter : 'audioonly'}))
      .on('end', () => {
        console.log('A música terminou!')
        serverQueue.songs.shift()
        this.play(msg, serverQueue.songs[0])
      })
      .on('error', err => {
        console.log(err)
      })
    
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
  },

  async getVideoId(args) {
    if (!args.startsWith('[')) return args
  
    const startPos = args.indexOf('[') + 1
    const endPos = args.indexOf(']')
    const ytQuery = args.substring(startPos, endPos)
    let videoId = ''
    //console.log(`query = ${ytQuery}`)
  
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet,id&maxResults=1&q=${ytQuery}&type=video&key=${process.env.API_KEY}`
  
    await axios.get(url)
      .then(response => {
        if (response.data.items.length === 0) throw new Error('Nenhum resultado foi encontrado')
        console.log(response.data)
        console.log('video id ' + response.data.items[0].id.videoId)
        videoId = response.data.items[0].id.videoId
      })
      .catch(error => {
        console.log(error)
        return
      })
    
    return videoId
  }
}