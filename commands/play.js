const ytdl = require('ytdl-core')
const axios = require('axios')
const {parseYoutubeQuery, parseCommandQuery} = require('../helpers/MessageParser')
const MessageBuilder = require('../helpers/MessageBuilder')

module.exports = {
  name : 'play',
  description : `Procura e toca a música passada depois do comando '/play'
                Como usar: /play LINK DO YOUTUBE ou /play [pesquisa]`,
  async execute(msg) {
    try {
      const args = parseCommandQuery(msg)
      const queue = msg.client.queue
      const serverQueue = queue.get(msg.guild.id)
      const voiceChannel = msg.member.voiceChannel
      let videoId = ''

      if (!voiceChannel)
        return MessageBuilder.noVoiceChannel(msg)

      const permissions = voiceChannel.permissionsFor(msg.client.user)

      if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
        return MessageBuilder.connectionError(msg)

      try {
        //verify if command query is a youtube query ([query])
        if (args.startsWith('[')) {
          ytQuery = parseYoutubeQuery(args)
          MessageBuilder.searching(msg, ytQuery)
          videoId = await this.getVideoId(ytQuery)

        } else videoId = args
         
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
          queueConstruct.connection = conn

          this.play(msg, queueConstruct.songs[0])
        } catch (error) {
          queue.delete(msg.guild.id)
          return msg.channel.send(error)
        }

      } else {
        serverQueue.songs.push(song)
        console.log(serverQueue.songs)

        MessageBuilder.addingToQueue(msg, song.title)

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
    
    MessageBuilder.playing(msg, song.title)
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

  async getVideoId(query) {  
    
    let videoId = ''
  
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet,id&maxResults=1&q=${query}&type=video&key=${process.env.API_KEY}`
  
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