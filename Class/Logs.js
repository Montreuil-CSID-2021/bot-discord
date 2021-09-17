// - - - Node Module - - - //
const fs = require("fs")

// - - - Import Class - - - //
const Utils = require("./Utils")

// - - - Class de logs - - - //
class Logs
{
    /** @private
     *  @type {string} */
    static logsDir = `${__dirname}/../Logs`

    /** @private
     *  @param {string} log */
    static writeLog(log) {
        let string_date = Utils.getStringDate()

        if(!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, 0o774)
        }

        let log_file = fs.createWriteStream(`${this.logsDir}/${string_date}.log`, {flags: 'a'})

        log_file.write(log + "\n")
    }

    /** @param {string} content */
    static info(content) {
        let time = Utils.getStringDateAndTime()
        console.log('\x1b[37m' + time + ' \x1b[36minfo \x1b[37m: ' + content)
        this.writeLog(`${time} info : ${content}`)
    }

    /** @param {string|Error} content */
    static error(content) {
        let time = Utils.getStringDateAndTime()
        console.log('\x1b[37m' + time + ' \x1b[31merror \x1b[37m: ' + content.toString())
        this.writeLog(`${time} error : ${content.toString()}`)
    }

    /** @param {string} content */
    static warn(content) {
        let time = Utils.getStringDateAndTime()
        console.log('\x1b[37m' + time + ' \x1b[33mwarn \x1b[37m: ' + content)
        this.writeLog(`${time} warn : ${content}`)
    }
}

module.exports = Logs
