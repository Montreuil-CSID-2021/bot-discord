// - - - Node Module - - - //
const Discord = require('discord.js')

// - - - Import Class - - - //
const Logs = require("./Class/Logs")

// - - - Import Config - - - //
const config = require('./config.json')
const CommandManager = require("./Class/CommandManager")
const Utils = require("./Class/Utils")

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

    client.commands = new CommandManager()

    client.commands.autoAddAllCommand()
    console.log(client.commands.commandsList)

    Logs.info(`client discord en ligne sur le serveur : ${client.guilds.cache.map(guild => guild.name).join(', ')}`)
})

client.on('error', err => Logs.error(err));

client.on("messageCreate", async message => {
    // Deploy slash commands
    if((message.content === `<@!${client.user.id}> deploy slash commands`)) {
        if(!client.application?.owner) await client.application.fetch()
        if(client.application.owner.members.find(m => m.user.id === message.author.id)) {
            await message.guild.commands.set(client.commands.slashData).then(commands => {
                commands.forEach(cmd => {
                    let permissions = client.commands.getCommandByName(cmd.name).slashPermission
                    if(permissions && (permissions.length > 0)) cmd.permissions.set({permissions})
                })
            })

            await message.reply('Déploiement des slash commands')
        } else await message.delete()
    }
})

// Gestion des Interaction
client.on('interactionCreate', /** @param {Discord.Interaction||Discord.CommandInteraction} interaction */ async (interaction) => {
    try {
        // Command Slash
        if(interaction.isCommand()) {
            // si une command est retourné
            let command = client.commands.getCommandFromInteraction(interaction)
            if(command) {
                // si le membre à la permission d'utiliser la commande
                if(command.hasPermission(interaction.member)) {
                    // Si la commande est executable
                    if(command.execute)
                    {
                        // Exécuté la commande si toutes les conditions précédente sont réuni
                        command.execute(interaction)
                            .then(() => Logs.info(`Commande ${Utils.getCommandStringFromInteraction(interaction)} exécuté par ${interaction.member.user.tag} dans le salon ${interaction.channel.name}`))
                            .catch(e => Logs.error(e.toString()))
                    }
                    else await interaction.reply({content: `Une erreur est survenue lors de l'exécution`, ephemeral: true})
                } else await interaction.reply({content: "'Vous n'avez pas la permission d'exécuter cette commande'", ephemeral: true})
            } else await interaction.reply({content: 'Commande invalide', ephemeral: true})
        }
    } catch (e) {
        Logs.error(e.toString())
    }
})
