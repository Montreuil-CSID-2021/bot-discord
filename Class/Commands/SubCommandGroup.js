class SubCommandGroup {
    /** @type {string} */
    name
    /** @type {string} */
    description
    /** @type {Array<SubCommand>} */
    subCommands

    /** @param {string} name
     *  @param {string} description
     *  @param {Array<SubCommand>} subCommands */
    constructor(name, description, subCommands = []) {
        this.name = name
        this.description = description
        this.subCommands = subCommands
    }

    /** @param {String} name
     *  @return {SubCommand} */
    getSubCommandByName(name)
    {
        return this.subCommands.find(subCommand => subCommand.name === name)
    }

    /** @return {any} slashData */
    get slashData()
    {
        let data = {}
        data.name = this.name
        data.description = this.description
        data.type = 'SUB_COMMAND_GROUP'

        if(this.subCommands.length > 0) {
            data.options = this.subCommands.map(subCommand => subCommand.slashData)
        }

        return data
    }
}

module.exports = SubCommandGroup
