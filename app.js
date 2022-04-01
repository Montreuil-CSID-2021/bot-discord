// - - - Node Module - - - //
const Discord = require('discord.js')

// - - - Import Class - - - //
const Logs = require("./Class/Logs")

// - - - Import Config - - - //
const config = require('./config.json')
const CommandManager = require("./Class/Commands/CommandManager")
const Utils = require("./Class/Utils")

EdtManager = require("./Class/EDT/EDTManager")

// - - - Client Discord - - - //
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]
})
client.login(config.discord.token).catch(err => Logs.error(err))

client.once('ready', () => {
    client.user.setPresence({
        activities: [{
            name: config.discord.presence.name, type: config.discord.presence.type
        }], status: "online"
    })

    client.commands = new CommandManager()

    EdtManager.init()

    Logs.info(`client discord en ligne sur le serveur : ${client.guilds.cache.map(guild => guild.name).join(', ')}`)
})

client.on('error', err => Logs.error(err));

client.on("messageCreate", async message => {
    // Deploy slash commands
    if ((message.content === `<@!${client.user.id}> deploy slash commands`)) {
        if (!client.application?.owner) await client.application.fetch()
        if (client.application.owner.members.find(m => m.user.id === message.author.id)) {
            await message.guild.commands.set(client.commands.slashData).then(commands => {
                commands.forEach(cmd => {
                    let permissions = client.commands.getCommandByName(cmd.name).slashPermission
                    if (permissions && (permissions.length > 0)) cmd.permissions.set({permissions})
                })
            })

            await message.reply('Déploiement des slash commands')
        } else await message.delete()
    }

    // Remove slash commands
    if ((message.content === `<@!${client.user.id}> delete slash commands`)) {
        if (!client.application?.owner) await client.application.fetch()
        if (client.application.owner.members.find(m => m.user.id === message.author.id)) {
            await message.guild.commands.fetch().then(commands => commands.forEach(command => {
                command.delete()
            }))
            await message.reply('Commands supprimé')
        } else await message.delete()
    }
})

// Gestion des Interaction
client.on('interactionCreate', /** @param {Discord.Interaction||Discord.CommandInteraction} interaction */ async (interaction) => {
    try {
        // Command Slash
        if (interaction.isCommand()) {
            // si une command est retourné
            let command = client.commands.getCommandFromInteraction(interaction)
            if (command) {
                // si le membre à la permission d'utiliser la commande
                if (command.hasPermission(interaction.member)) {
                    // Si la commande est executable
                    if (command.execute) {
                        // Exécuté la commande si toutes les conditions précédente sont réuni
                        command.execute(interaction)
                            .then(() => Logs.info(`Commande ${Utils.getCommandStringFromInteraction(interaction)} exécuté par ${interaction.member.user.tag} dans le salon ${interaction.channel.name}`))
                            .catch(e => Logs.error(e.toString()))
                    } else await interaction.reply({
                        content: `Une erreur est survenue lors de l'exécution`, ephemeral: true
                    })
                } else await interaction.reply({
                    content: "'Vous n'avez pas la permission d'exécuter cette commande'", ephemeral: true
                })
            } else await interaction.reply({content: 'Commande invalide', ephemeral: true})
        }
    } catch (e) {
        Logs.error(e.toString())
    }
})

function generateEmbedFieldsForCourse(courses) {
    return courses.map(course => {
        course.start = new Date(course.start)
        course.end = new Date(course.end)
        return {
            name: `📅 ${course.subject} - ${course.type} (${course.location})`,
            value: `${course.teacher}\nLe ${course.start.toLocaleDateString('fr-FR', {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            })}\nDe ${course.start.toLocaleTimeString('fr-FR', {
                hour: "numeric", minute: "numeric"
            })} à ${course.end.toLocaleTimeString('fr-FR', {
                hour: "numeric", minute: "numeric"
            })}`
        }
    })
}

function generateEmbedForCourseFields(fields, title, color){
    let embed =  new Discord.MessageEmbed()
        .setTitle(`${title} (${fields.length})`)
        .setColor(color)
        .setFooter({
            text: `Alerte de mise à jour - Emploi du temps CSID - promo 2021/2022`
        })
        .setTimestamp()

    let total = fields.length
    if(fields.length > 24) {
        fields = fields.slice(0, 24)
        fields.push({
            name: 'Et plus...',
            value: `${total - 24} cours supplémentaires`
        })
    }

    embed.addFields(fields)

    return embed
}

EdtManager.events.on('coursesChange', async (removedCourses, addedCourses) => {
    /** @type {Discord.TextChannel|Discord.Channel} */
    let channel = client.channels.cache.find(channel => channel.id === config.iut.channelId)

    if (channel && channel.isText()) {
        /**
         * @type {array<{old: Course, new: Course}>}
         */
        let modifiedCourses = []

        for (let i = 0; i < removedCourses.length; i++) {
            let oldCourse = removedCourses[i]
            let newCourse = addedCourses.find(course => course.start.getTime() === oldCourse.start.getTime())
            if (newCourse) {
                modifiedCourses.push({old: oldCourse, new: newCourse})
            }
        }

        addedCourses = addedCourses.filter(course => !modifiedCourses.find(c => c.new.id === course.id))
        removedCourses = removedCourses.filter(course => !modifiedCourses.find(c => c.old.id === course.id))

        let embeds = []

        if(removedCourses.length > 0) {
            let removedCoursesField = generateEmbedFieldsForCourse(removedCourses)

            embeds.push(generateEmbedForCourseFields(removedCoursesField, '🥳 Cours supprimés', '#DC0B17'))
        }

        if(addedCourses.length > 0) {
            let addedCoursesField = generateEmbedFieldsForCourse(addedCourses)

            embeds.push(generateEmbedForCourseFields(addedCoursesField, '🤔 Cours ajoutés', '#24BC7C'))
        }

        if(modifiedCourses.length > 0) {
            let modifiedCoursesField = modifiedCourses.map(data => {
                let oldCourse = data.old
                let newCourse = data.new

                let oldTitle = `${oldCourse.subject} - ${oldCourse.type} (${oldCourse.location})`
                let newTitle = `${newCourse.subject} - ${newCourse.type} (${newCourse.location})`
                let title = '📅 ' + ((oldTitle !== newTitle) ? `${oldTitle} -> ${newTitle}` : oldTitle)

                let oldTeacher = oldCourse.teacher
                let newTeacher = newCourse.teacher
                let teacher = (oldTeacher !== newTeacher) ? `${oldTeacher} -> ${newTeacher}` : oldTeacher

                let oldDate = oldCourse.start.toLocaleDateString('fr-FR', {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                })
                let newDate = newCourse.start.toLocaleDateString('fr-FR', {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                })
                let date = (oldDate !== newDate) ? `${oldDate} -> ${newDate}` : oldDate

                let start = oldCourse.start.toLocaleTimeString('fr-FR', {
                    hour: "numeric", minute: "numeric"
                })
                let oldEnd = oldCourse.end.toLocaleTimeString('fr-FR', {
                    hour: "numeric", minute: "numeric"
                })
                let newEnd = newCourse.end.toLocaleTimeString('fr-FR', {
                    hour: "numeric", minute: "numeric"
                })
                let time = (oldEnd !== newEnd) ? `De ${start} à ${oldEnd} -> De ${start} à ${newEnd} ` : `De ${start} à ${oldEnd}`

                return {name: title, value: `${teacher}\n${date}\n${time}`}
            })

            embeds.push(generateEmbedForCourseFields(modifiedCoursesField, '😬 Cours modifiés', '#DC9D1D'))
        }

        await channel.send({content: "🚨 Changement détecté sur l'emploi du temps 🚨",embeds: embeds})
    }
})
