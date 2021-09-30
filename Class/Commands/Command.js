// - - - Import des class - - - //
const AbstractCommand = require("./AbstractCommand");

// - - - Import Config - - - //
const config = require('../../config.json')

class Command extends AbstractCommand {
    /** @type {Array<string>} */
    roles
    /** @type {Array<SubCommand>} */
    subCommands
    /** @type {Array<SubCommandGroup>} */
    subCommandGroups

    /** @param {string} name
     *  @param {string} description
     *  @param {array<Object>} options
     *  @param {array<string>} roles
     *  @param {Function} execute
     *  @param {Array<SubCommand>} subCommands
     *  @param {Array<SubCommandGroup>} subCommandGroups */
    constructor(name, description, options, roles, execute, subCommands= [], subCommandGroups = []) {
        let rolesId = []
        if (roles) {
            roles.forEach(r => {
                let cr = config.commands.roles[r]
                if (cr) rolesId.push(cr)
            })
        }

        super(name, description, options, execute)

        this.roles = rolesId
        this.subCommands = subCommands
        this.subCommandGroups = subCommandGroups
    }

    hasPermission(member)
    {
        let result = false
        this.roles.forEach(rId => {
            if(member.roles.cache.find(role => role.id === rId)) result = true
        })
        return result
    }

    get slashData()
    {
        let data = super.slashData

        if(this.subCommands.length > 0) {
            data.options = data.options.concat(this.subCommands.map(subCommand => subCommand.slashData))
        }

        if(this.subCommandGroups.length > 0) {
            data.options = data.options.concat(this.subCommandGroups.map(subCommandGroup => subCommandGroup.slashData))
        }

        return data
    }

    get slashPermission() {
        let permission = []
        this.roles.forEach(role => {
            permission.push({
                id: role,
                type: 'ROLE',
                permission: true
            })
        })
        if(permission.length > 0) return permission
        else return null
    }
}

module.exports = Command
