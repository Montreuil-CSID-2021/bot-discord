// - - - Node Module - - - //
const Discord = require('discord.js')

// - - - Import Class - - - //
const Logs = require("./Class/Logs")

// - - - Import Config - - - //
const config = require('./config.json')

// - - - Client Discord - - - //
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
})
client.login(config.discord.token).catch(err => Logs.error(err))

client.on('ready', () => {
    client.user.setPresence({
        activities: [
            {
                name: config.discord.presence.name,
                type: config.discord.presence.type
            }
        ],
        status: "online"
    })

    Logs.info(`Bot discord en ligne sur le serveur : ${client.guilds.cache.map(guild => guild.name).join(', ')}`)
})

client.on('error', err => Logs.error(err))
