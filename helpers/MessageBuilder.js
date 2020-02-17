module.exports = {
  searching(msg, query) {
    msg.channel.send(`:mag: Procurando por \`${query}\``)
  },

  playing(msg, music) {
    msg.channel.send(`:notes: Tocando \`${music}\``)
  },

  addingToQueue(msg, music) {
    msg.channel.send(`:notes: \`${music}\` foi adicionada a fila de reprodução`)
  },

  connectionError(msg) {
    return msg.channel.send('Eu preciso de permissão para me conectar e falar no canal de voz')
  },

  noVoiceChannel(msg) {
    return msg.channel.send('Você precisa estar em uma canal de voz para tocar música!')
  }
}
