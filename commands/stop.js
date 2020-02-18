module.exports =  {
  name : 'stop',
  description: `Para de tocar música`,
  async execute(msg) {
    const serverQueue = msg.client.queue.get(msg.guild.id)

    if (!msg.member.voiceChannel)
      return msg.channel.send('Você precisa estar em uma canal de voz para para parar a música!')

    serverQueue.songs = []
    serverQueue.connection.dispatcher.end()
  }
}