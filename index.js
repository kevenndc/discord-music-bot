require('dotenv').config()

//Requests
const Discord = require('discord.js');
const {prefix} = require('./config.json')
const ytdl = require('ytdl-core')
const queue = new Map()
const axios = require('axios')
const client = new Discord.Client();

const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=teste&type=video&key=${process.env.API_KEY}`

axios.get(url)
  .then(response => {
    console.log(response)
  })
  .catch(error => {
    console.log(error)
  })

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

//------------------------------------------------------------------------------------------------------------------

// require('dotenv').config()
// const Discord = require('discord.js');
// const {prefix} = require('./config.json');
// const ytdl = require('ytdl-core');

// const client = new Discord.Client();

// const queue = new Map();

// client.once('ready', () => {
// 	console.log('Ready!');
// });

// client.once('reconnecting', () => {
// 	console.log('Reconnecting!');
// });

// client.once('disconnect', () => {
// 	console.log('Disconnect!');
// });

// client.on('message', async message => {
// 	if (message.author.bot) return;
// 	if (!message.content.startsWith(prefix)) return;

// 	const serverQueue = queue.get(message.guild.id);

// 	if (message.content.startsWith(`${prefix}play`)) {
// 		execute(message, serverQueue);
// 		return;
// 	} else if (message.content.startsWith(`${prefix}skip`)) {
// 		skip(message, serverQueue);
// 		return;
// 	} else if (message.content.startsWith(`${prefix}stop`)) {
// 		stop(message, serverQueue);
// 		return;
// 	} else {
// 		message.channel.send('You need to enter a valid command!')
// 	}
// });

// async function execute(message, serverQueue) {
// 	const args = message.content.split(' ');

// 	const voiceChannel = message.member.voiceChannel;
// 	if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music!');
// 	const permissions = voiceChannel.permissionsFor(message.client.user);
// 	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
// 		return message.channel.send('I need the permissions to join and speak in your voice channel!');
// 	}

// 	const songInfo = await ytdl.getInfo(args[1]);
// 	const song = {
// 		title: songInfo.title,
// 		url: songInfo.video_url,
// 	};

// 	if (!serverQueue) {
// 		const queueContruct = {
// 			textChannel: message.channel,
// 			voiceChannel: voiceChannel,
// 			connection: null,
// 			songs: [],
// 			volume: 5,
// 			playing: true,
// 		};

// 		queue.set(message.guild.id, queueContruct);

// 		queueContruct.songs.push(song);

// 		try {
// 			var connection = await voiceChannel.join();
// 			queueContruct.connection = connection;
// 			play(message.guild, queueContruct.songs[0]);
// 		} catch (err) {
// 			console.log(err);
// 			queue.delete(message.guild.id);
// 			return message.channel.send(err);
// 		}
// 	} else {
// 		serverQueue.songs.push(song);
// 		console.log(serverQueue.songs);
// 		return message.channel.send(`${song.title} has been added to the queue!`);
// 	}

// }

// function skip(message, serverQueue) {
// 	if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
// 	if (!serverQueue) return message.channel.send('There is no song that I could skip!');
// 	serverQueue.connection.dispatcher.end();
// }

// function stop(message, serverQueue) {
// 	if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
// 	serverQueue.songs = [];
// 	serverQueue.connection.dispatcher.end();
// }

// function play(guild, song) {
// 	const serverQueue = queue.get(guild.id);

// 	if (!song) {
// 		serverQueue.voiceChannel.leave();
// 		queue.delete(guild.id);
// 		return;
// 	}

// 	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
// 		.on('end', () => {
// 			console.log('Music ended!');
// 			serverQueue.songs.shift();
// 			play(guild, serverQueue.songs[0]);
// 		})
// 		.on('error', error => {
// 			console.error(error);
// 		});
// 	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
// }

client.login(process.env.BOT_TOKEN);