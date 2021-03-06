module.exports = {
  name : 'skip',
  description : `Pula para a próxima da música da fila, se houver`,
  async execute(msg) {
    const serverQueue = msg.client.queue.get(msg.guild.id)

    if (!msg.member.voiceChannel)
      return msg.channel.send('Você precisa estar em uma canal de voz para pular músicas!')

    if (!serverQueue)
      return msg.channel.send('Não há músicas para pular!')

    serverQueue.connection.dispatcher.end()
  }
}