const ical = require('node-ical')

const config = require('./../../config.json')
const Utils = require("../Utils");
const {MessageEmbed} = require("discord.js");
const Logs = require("../Logs");
const EdtDay = require('./EDTDay');

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

class EDTManager {
    /** @return {Promise<Array<EdtDay>>} */
    static async getEdt() {
        const url = "https://agenda.iut.univ-paris8.fr"
        let data = await ical.async.fromURL(url, {
            auth: {
                username: config.iut.username,
                password: config.iut.password
            }
        })

        /** @type {Array<EdtDay>} */
        let days = []

        for (let k in data) {
            if (data.hasOwnProperty(k)) {
                const ev = data[k]
                if (data[k].type === "VEVENT") {
                    let edtDay = new EdtDay()
                    let splitSummary = ev.summary.split(/(Cours|TD|Controle)/)


                    if (splitSummary[2]) {
                        let brutData = splitSummary[2]
                        if (brutData.includes("SALLE VIDE")) {
                            edtDay.location = "A distance"
                            brutData = brutData.replace("SALLE VIDE", "").trim()
                        } else {
                            let brutDataSplit = brutData.split(' ')
                            edtDay.location = brutDataSplit[brutDataSplit.length - 1]
                            brutData = brutData.replace(edtDay.location, "").trim()
                        }

                        if (brutData.includes('PROF VIDE')) {
                            edtDay.teacher = "En autonomie"
                        } else {
                            edtDay.teacher = brutData
                        }
                    }

                    edtDay.subject = splitSummary[0]?.trim()
                    edtDay.type = splitSummary[1]?.trim()
                    edtDay.start = ev.start
                    edtDay.end = ev.end

                    days.push(edtDay)
                }
            }
        }

        return days
    }

    /** @param {Date} dateOfWeek */
    static async getEmbedEDT(dateOfWeek) {
        let dateToFetch = Utils.getMondayOfWeek(dateOfWeek)

        let result = null

        await this.getEdt().then(edt => {
            let weekDate = dateToFetch
            let weekDateEnd = new Date(((dateToFetch.getTime() / 1000) + (86400 * 4)) * 1000)
            let weedDateEndPlusOne = new Date(((dateToFetch.getTime() / 1000) + (86400 * 5)) * 1000)

            let days = edt.filter(edtDay => {
                return edtDay.start.getTime() >= weekDate.getTime() && edtDay.start.getTime() <= weedDateEndPlusOne.getTime()
            })

            let embed = new MessageEmbed()
                .setTitle(`Semaine du ${weekDate.toLocaleDateString("fr-FR").split(",")[0]} au ${weekDateEnd.toLocaleDateString("fr-FR").split(",")[0]}`)
                .setColor(`#0982AB`)
                .setFooter({
                    text: `Emploi du temps CSID - promo 2021/2022`
                })
                .setTimestamp()
                .setThumbnail("https://www.iut.univ-paris8.fr/sites/default/files/inline-images/LOGO%20IUT%20MONTREUIL%20BLANC%20Moyen.png");

            for (let i = 0; i < 5; i++) {
                let time = dateToFetch.getTime() + (86400000 * i)
                let dayDate = new Date(time)
                let content = "Rien à signaler"
                if (days) {
                    // check if is the same date
                    let contentList = days.filter(
                        data => data.start.getDate() === dayDate.getDate() && data.start.getMonth() === dayDate.getMonth() && data.start.getFullYear() === dayDate.getFullYear()
                    ).map(
                        data => {
                            return `**${data.subject}** (${data.location})\n${data.teacher}\nDe ${Utils.toTwoDigitTime(data.start.getHours())}:${Utils.toTwoDigitTime(data.start.getMinutes())} à ${Utils.toTwoDigitTime(data.end.getHours())}:${Utils.toTwoDigitTime(data.end.getMinutes())}`
                        }
                    )

                    if (contentList.length > 0) content = contentList.join("\n\n")
                }
                embed.addField(`📅 ${daysOfWeek[i]}`, content)
            }
            result = embed

        }).catch(() => {
            throw new Error()
        })
        return result
    }
}

module.exports = EDTManager
