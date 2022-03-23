const axios = require('axios')

const config = require('./../../config.json')
const Utils = require("../Utils");
const {MessageEmbed} = require("discord.js");
const Logs = require("../Logs");

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

class EDTManager {
    /** @param {Date} dateOfWeek */
    static async scrapEDT(dateOfWeek) {
        let mondayDate = Utils.getMondayOfWeek(dateOfWeek)
        let sundayDate = new Date(mondayDate.getTime() + 518400000)

        let response = await axios.get('http://localhost:4201/edt', {
            headers: {
                token: config.iut.token
            }
        }).catch(e => Logs.error("Impossible de récupérer l'emploi du temps" + e.toString()))

        response = response.data

        if(response) {
            response.days = response.days
                .map(day => {
                    day.startDate = new Date(day.startDate)
                    day.endDate = new Date(day.endDate)
                    return day
                })
                .filter(day => day.startDate >= mondayDate && day.startDate < sundayDate)
        }

        console.log(response)

        return response
    }

    /** @param {Date} dateOfWeek */
    static async getEmbedEDT(dateOfWeek) {
        let dateToFetch = Utils.getMondayOfWeek(dateOfWeek)

        let result = null

        await this.scrapEDT(dateToFetch).then(edt => {
            if(edt) {
                let weekDate = dateToFetch
                let weekDateEnd = new Date(((dateToFetch.getTime()/1000)+(86400*4))*1000)

                let name = edt.edt
                let days = edt.days

                let embed = new MessageEmbed()
                    .setTitle(`Semaine du ${weekDate.toLocaleDateString("fr-FR").split(",")[0]} au ${weekDateEnd.toLocaleDateString("fr-FR").split(",")[0]}`)
                    .setColor(`#0982AB`)
                    .setFooter({
                        text: `Emploi du temps CSID - promo 2021/2022`
                    })
                    .setTimestamp()
                    .setThumbnail("https://www.iut.univ-paris8.fr/sites/default/files/inline-images/LOGO%20IUT%20MONTREUIL%20BLANC%20Moyen.png");

                for(let i = 1; i<=5; i++) {
                    let time = dateToFetch.getTime() + (84000000 * i)
                    let dayDate = new Date(time)
                    let content = "Rien à signaler"
                    if(days) {
                        let contentList = days.filter(
                            data => data.startDate.toLocaleDateString("fr-FR") === dayDate.toLocaleDateString("fr-FR")
                        ).map(
                            data => {
                                return `**${data.subject}** (${data.location})\n${data.teacher}\nDe ${Utils.toTwoDigitTime(data.startDate.getHours())}:${Utils.toTwoDigitTime(data.startDate.getMinutes())} à ${Utils.toTwoDigitTime(data.endDate.getHours())}:${Utils.toTwoDigitTime(data.endDate.getMinutes())}`
                            }
                        )

                        if(contentList.length > 0) content = contentList.join("\n\n")
                    }
                    embed.addField(`📅 ${daysOfWeek[i-1]}`, content)
                }
                result = embed
            } else throw new Error()
        }).catch(() => {
            throw new Error()
        })
        return result
    }
}

module.exports = EDTManager
