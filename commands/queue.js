module.exports = {
  name : 'q',
  description : `Mostra a fila de reprodução`,
  async execute(msg) {
    const serverQueue = msg.client.queue.get(msg.guild.id)

    if (!serverQueue.songs)
      return msg.channel.send('Não há músicas na fila de reprodução!')

    const songs = serverQueue.songs
    let songQueue = 'Fila de reprodução:\n'

    songs.map((song, index) => {
      songQueue += `${++index} - \`${song.title}\`\n`
    })

    msg.channel.send(songQueue)
  }
}