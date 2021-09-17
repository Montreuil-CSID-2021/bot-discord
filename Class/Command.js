// - - - Import des modules - - - //
const Discord = require('discord.js')

// - - - Import Config - - - //
const config = require('./../config.json')

class Command {
    /** @param {string} name
     *  @param {string} description
     *  @param {array<Object>} options
     *  @param {array<string>} roles
     *  @param {Function} execute
     *  @param {CommandManager||null} subCommands
     *  @return {void} */
    constructor(name, description, options, roles, execute, subCommands) {
        let rolesId = []
        if (roles) {
            roles.forEach(r => {
                let cr = config.commands.roles[r]
                if (cr) rolesId.push(cr)
            })
        }

        /** @type {string} */
        this.name = name
        /** @type {string} */
        this.description = description
        /** @type {array<any>||any} */
        this.options = options
        /** @type {Array<string>} */
        this.roles = rolesId
        /** @type {Function} */
        this.execute = execute
        /** @type {CommandManager||null} */
        this.subCommands = subCommands
    }

    /** @param {Discord.GuildMember} member
     *  @return {boolean} hasPermission */
    hasPermission(member)
    {
        let result = false
        this.roles.forEach(rId => {
            if(member.roles.cache.find(role => role.id === rId)) result = true
        })
        return result
    }

    /** @return {any} slashData */
    get slashData()
    {
        let data = {}
        data.name = this.name
        data.description = this.description
        data.defaultPermission = false

        if(this.subCommands) {
            data.options = this.subCommands.subSlashData
        }

        if(this.options) {
            if(!data.options) data.options = []
            this.options.forEach(op => data.options.push(op))
        }

        return data
    }

    /** @return {any} slashData */
    get subSlashData()
    {
        let data = {}
        data.name = this.name
        data.description = this.description
        data.type = 'SUB_COMMAND'

        if(this.options) {
            data.options = []
            this.options.forEach(op => data.options.push(op))
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
        return permission
    }
}

module.exports = Command
