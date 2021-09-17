// - - - Node Module - - - //
const Discord = require('discord.js')
const fs = require('fs');

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

    Logs.info(`client discord en ligne sur le serveur : ${client.guilds.cache.map(guild => guild.name).join(', ')}`)
})

client.on('error', err => Logs.error(err));

/*
** Commands Handler
*/
client.commands = new Discord.Collection();

fs.readdir("./cmds/", (err, files) => {

  if (err) return console.log(err);
  let jsfiles = files.filter(f => f.split(".").pop() === "js");
  if (jsfiles.length <= 0) {
    console.log('No command to load !')
    return;
  }

  console.log(`Loading ${jsfiles.length} commands...`);

  jsfiles.forEach((f, i) => {
    let props = require(`./cmds/${f}`);
    console.log(`${i + 1}: ${f} loaded !`);
    client.commands.set(props.help.name, props);
  });
});

client.on("message", async message => {

    let messageArray = message.content.split(/\s+/g);
    let command = messageArray[0];
    //Arguments
    let args = message.content.split(" ").slice(1, message.content.split(" ").length);
  
    if (!command.startsWith(prefix)) return;
    let cmd = client.commands.get(command.slice((prefix).length));
    if (cmd) cmd.run(client, message, Discord, config);
  
  })