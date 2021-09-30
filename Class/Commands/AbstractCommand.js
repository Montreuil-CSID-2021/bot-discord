/** @abstract */
class AbstractCommand {
    /** @type {string} */
    name
    /** @type {string} */
    description
    /** @type {array<any>||any} */
    options
    /** @type {Function} */
    execute

    /** @param {string} name
     *  @param {string} description
     *  @param {array<Object>} options
     *  @param {Function} execute */
    constructor(name, description, options, execute) {
        this.name = name
        this.description = description
        this.options = options
        this.execute = execute
    }

    /** @return {any} */
    get slashData()
    {
        let data = {}
        data.name = this.name
        data.description = this.description
        data.options = []

        if(this.options) {
            this.options.forEach(op => data.options.push(op))
        }

        return data
    }

    /** @return {any} */
    get slashPermission() {
        return []
    }

    /** @external GuildMember
     *  @param {GuildMember} member
     *  @return {boolean} */
    hasPermission(member)
    {
        return false
    }
}

module.exports = AbstractCommand
