// - - - Import des modules - - - //
const fs = require('fs')

// - - - Import des class - - - //
const Logs = require("../Logs")
const Command = require("./Command");
const SubCommand = require("./SubCommand");
const SubCommandGroup = require("./SubCommandGroup");

class CommandManager {
    /** @type {Array<Command>} */
    commands

    constructor() {
        this.commands = []
        try {
            // Pour tout les fichiers ce trouvant dans le dossier Commands
            fs.readdirSync('./cmds').filter(file => file.endsWith('.js') && !file.includes('template')).forEach(file => {
                let jsonCommand = require(`../../cmds/${file}`)

                // Ajout des commandes
                if(jsonCommand.enable)
                {
                    let command = new Command(jsonCommand.name,
                        jsonCommand.description,
                        jsonCommand.options,
                        jsonCommand.roles,
                        jsonCommand.execute
                    )
                    this.commands.push(command)

                    // Si la commande possède des sous commandes
                    if(jsonCommand.subCommands)
                    {
                        command.subCommands = this.parseJsonToSubCommands(jsonCommand.subCommands, command)
                    }

                    // Si la commande possède des groupes de sous commandes
                    if(jsonCommand.subCommandGroups)
                    {
                        command.subCommandGroups = this.parseJsonToSubCommandGroups(jsonCommand.subCommandGroups, command)
                    }
                }
            })
        } catch (e) {
            Logs.error(e)
        }
    }

    /** @param {Array<Object>} jsonSubCommands
     *  @param {Command} mainCommand
     *  @return {Array<SubCommand>} */
    parseJsonToSubCommands(jsonSubCommands, mainCommand) {
        let subCommands = []

        // Ajout des sous commandes
        jsonSubCommands.forEach(subCommand => {
            if(subCommand.enable)
            {
                try {
                    subCommands.push(
                        new SubCommand(subCommand.name,
                            subCommand.description,
                            subCommand.options,
                            subCommand.execute,
                            mainCommand
                        )
                    )
                } catch (e) {
                    Logs.error("Erreur lors du parsing d'une sous commande")
                }
            }
        })

        return subCommands
    }

    /** @param {Array<Object>} jsonSubCommandGroups
     *  @param {Command} mainCommand
     *  @return {Array<SubCommandGroup>} */
    parseJsonToSubCommandGroups(jsonSubCommandGroups, mainCommand) {
        let subCommandGroups = []

        // Ajout des sous commandes
        jsonSubCommandGroups.forEach(subCommandGroup => {
            if(subCommandGroup.enable && subCommandGroup.subCommands)
            {
                try {
                    let subCommands = this.parseJsonToSubCommands(subCommandGroup.subCommands, mainCommand)

                    subCommandGroups.push(
                        new SubCommandGroup(subCommandGroup.name,
                            subCommandGroup.description,
                            subCommands
                        )
                    )
                } catch (e) {
                    Logs.error("Erreur lors du parsing d'un groupe de sous commande")
                }
            }
        })

        return subCommandGroups
    }

    /** Récupérer une commande par son nom
     *  @param {String} name
     *  @return {Command} command*/
    getCommandByName(name)
    {
        return this.commands.find(command => command.name === name)
    }

    /** Obtenir une commande à partir d'une Interaction Discord
     *  @external CommandInteraction
     *  @param {CommandInteraction} interaction
     *  @return {AbstractCommand} Command */
    getCommandFromInteraction(interaction)
    {
        let command = this.getCommandByName(interaction.commandName)

        if(command)
        {
            let subCommandGroupName = interaction.options.getSubcommandGroup(false)
            let subCommandName = interaction.options.getSubcommand(false)

            if(subCommandGroupName) {
                let subCommandGroup = command.subCommandGroups.find(subCommandGroup => subCommandGroup.name === subCommandGroupName)
                if(subCommandGroup) {
                    if(subCommandName) {
                        let subCommand = subCommandGroup.getSubCommandByName(subCommandName)
                        if(subCommand && subCommand.execute) return subCommand
                        else return null
                    } return null
                } else return null
            } else if(subCommandName) {
                let subCommand = command.subCommands.find(subCommand => subCommand.name === subCommandName)
                if(subCommand && subCommand.execute) return subCommand
                else return null
            } else if(command.execute) return command
            else return null
        }
        else return null
    }

    /** @return {any} slashData */
    get slashData()
    {
        return this.commands.map(command => command.slashData)
    }
}

module.exports = CommandManager
