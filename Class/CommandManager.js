// - - - Import des modules - - - //
const fs = require('fs')

// - - - Import des class - - - //
const Command = require('./Command')
const Logs = require("./Logs")

class CommandManager
{
    /** @private
     *  @type {Array<Command>} */
    commands = []

    /** Ajouter automatiquement les commandes du dossier cmds
     *  @return {void} */
    autoAddAllCommand()
    {
        try {
            // Pour tout les fichiers ce trouvant dans le dossier Commands
            fs.readdirSync('./cmds').filter(file => file.endsWith('.js') && !file.includes('template')).forEach(file => {
                let command = require(`../cmds/${file}`)

                let subCommands = new CommandManager()

                // Si la commande possède des sous commandes
                if(command.subCommands)
                {
                    // Ajout des sous commandes
                    command.subCommands.forEach(subCommand => {
                        if(subCommand.enable)
                        {
                            subCommands.addCommand(
                                new Command(subCommand.name,
                                    subCommand.description,
                                    subCommand.options,
                                    command.roles,
                                    subCommand.execute,
                                    null
                                )
                            )
                        }
                    })
                }
                else subCommands = null

                // Ajout des commandes
                if(command.enable)
                {
                    this.addCommand(
                        new Command(command.name,
                            command.description,
                            command.options,
                            command.roles,
                            command.execute,
                            subCommands
                        )
                    )
                }
            })
        } catch (e) {
            Logs.error(e)
        }
    }

    /** Ajouter une commande
     *  @param {Command} command */
    addCommand(command)
    {
        this.commands.push(command)
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
     *  @return {Command} Command */
    getCommandFromInteraction(interaction)
    {
        let command = this.getCommandByName(interaction.commandName)

        if(command)
        {
            let subCommandName = interaction.options.getSubcommand(false)
            if(command.subCommands && subCommandName)
            {
                let subCommand = command.subCommands.getCommandByName(subCommandName)
                if(subCommand) return subCommand
                else return null
            }
            else return command
        }
        else return null
    }

    /** @return {array<Command>} commandsList */
    get commandsList()
    {
        return this.commands
    }

    /** @return {any} slashData */
    get slashData()
    {
        return this.commands.map(command => command.slashData)
    }

    /** @return {any} slashData */
    get subSlashData()
    {
        return this.commands.map(command => command.subSlashData)
    }
}

module.exports = CommandManager
