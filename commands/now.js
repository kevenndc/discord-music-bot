module.exports = {
  name : 'now',
  description : `Mostra o que está tocando no momento`,
  async execute(msg) {
    const serverQueue = msg.client.queue.get(msg.guild.id)

    if (!serverQueue)
      return msg.channel.send('Não há músicas tocando no momento!')

    msg.channel.send(`Tocando agora: \`${serverQueue.songs[0].title}\``)
  }
}