const {prefix} = require('../config.json')

module.exports = {
  parseYoutubeQuery(args) {
    const startPos = args.indexOf('[') + 1
    const endPos = args.indexOf(']')
    return args.substring(startPos, endPos)
  },

  parseCommandName(msg) {
    return msg.content.split(' ')[0].split(`${prefix}`)[1]
  },

  parseCommandQuery(msg) {
    return msg.content.substr(msg.content.indexOf(' ') + 1)
  }
}