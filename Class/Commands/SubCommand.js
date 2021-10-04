// - - - Import Config - - - //
const AbstractCommand = require("./AbstractCommand");

class SubCommand extends AbstractCommand {
    /** @type {Command} */
    mainCommand

    /** @param {string} name
     *  @param {string} description
     *  @param {array<Object>} options
     *  @param {Function} execute
     *  @param {Command} mainCommand */
    constructor(name, description, options, execute, mainCommand) {
        super(name, description,options,execute)
        this.mainCommand = mainCommand
    }

    get slashData()
    {
        let data = super.slashData
        data.type = 'SUB_COMMAND'

        return data
    }

    hasPermission(member)
    {
        return this.mainCommand.hasPermission(member)
    }
}

module.exports = SubCommand
