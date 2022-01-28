const { webkit} = require('playwright')
const cheerio = require('cheerio')

const config = require('./../../config.json')
const Utils = require("../Utils");
const {MessageEmbed} = require("discord.js");
const Logs = require("../Logs");

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

let cache = {}

class EDTManager {
    /** @param {Date} dateOfWeek */
    static async scrapEDT(dateOfWeek) {
        let mondayDate = Utils.getMondayOfWeek(dateOfWeek)

        let potentialCache = cache[mondayDate.toLocaleDateString()]
        if(potentialCache && potentialCache.expire >= new Date()) return potentialCache.data

        try {
            const browser = await webkit.launch()
            const context = await browser.newContext()
            const page = await context.newPage()

            await page.goto(`https://cas.iut.univ-paris8.fr/login?service=https%3a%2f%2fent.iut.univ-paris8.fr%2f`)

            await page.fill("#username", config.iut.username)
            await page.fill("#password", config.iut.password)

            await page.click("text=SE CONNECTER")

            // récupération Emploi du temps
            await page.goto(`https://ent.iut.univ-paris8.fr/edt/presentations.php`)

            await page.screenshot({path: "lastCalendarView.png"})
            await page.click("#selectsem-button")

            await page.click(`#selectsem-menu>li:has-text("${mondayDate.toLocaleDateString()}")`)

            let html = await page.content()

            const $ = cheerio.load(html)

            let edtHtml = $("#quadrillage").html()
            let profList = $("#selectprof").find('option').toArray().map(el => el.children[0].data)

            let edtDays = edtHtml.split("</div><div").map(el => {
                if(!el.startsWith("<div")) el = "<div" + el
                if(!el.endsWith("</div>")) el = el + "</div>"
                return el
            }).filter(el => {
                return !el.includes("plageDIVn");
            }).map(el => {
                let day = {}

                day.mat = el.split("<strong>")[1].split("</strong>")[0]

                let profEtSalle = el.split(`<span class="plageHG">`)
                let profLettre = profEtSalle[1].split("</span>")[0]
                let profName = profList.find(prof => prof.includes(profLettre))
                day.prof = (profName) ? profName.toUpperCase() : (profEtSalle.length < 3) ? "Autonomie" : profLettre
                day.salle = profEtSalle[profEtSalle.length-1].split("</span>")[0].split("&")[0]

                let style = el.split("style=\"")[1].split("\"")[0].split(";")

                day.debut = mondayDate.getTime()/1000
                day.debut += 24 * 60 * 60 * style.find(s => s.includes("margin-left")).split(':')[1].split("%")[0]/80*4
                day.debut += 60 * (style.find(s => s.includes("top")).split(':')[1].split("px")[0]-30+480)

                day.debutText = (new Date(day.debut * 1000)).toLocaleString()

                day.fin = day.debut
                day.fin += 60 * (style.find(s => s.includes("height")).split(':')[1].split("px")[0])

                day.finText = (new Date(day.fin * 1000)).toLocaleString()

                return day
            })

            edtDays.sort((a, b) => a.debut - b.debut)

            let expireCacheDate = new Date((new Date().getTime()/1000 + 3600)*1000)
            cache[mondayDate.toLocaleDateString()] = {
                expire: expireCacheDate,
                data: edtDays
            }

            return edtDays
        } catch (e) {
            Logs.error(e)
            return null
        }
    }

    /** @param {Date} dateOfWeek */
    static async getEmbedEDT(dateOfWeek) {
        let dateToFetch = Utils.getMondayOfWeek(dateOfWeek)

        let result = null

        await this.scrapEDT(dateToFetch).then(edt => {
            if(edt) {
                let weekDate = dateToFetch
                let weekDateEnd = new Date(((dateToFetch.getTime()/1000)+(86400*4))*1000)

                let embed = new MessageEmbed()
                    .setTitle(`Semaine du ${weekDate.toLocaleDateString().split(",")[0]} au ${weekDateEnd.toLocaleDateString().split(",")[0]}`)
                    .setColor(`#0982AB`)
                    .setFooter(`Emploi du temps CSID - promo 2021/2022`)
                    .setTimestamp()
                    .setThumbnail("https://www.iut.univ-paris8.fr/sites/default/files/LOGO%20IUT%20MONTREUIL%20Moyen.jpg");

                for(let i = 1; i<=5; i++) {
                    let time = (dateToFetch.getTime()/1000) + (84700 * i)
                    let dayDate = new Date(time*1000)
                    let content = "Rien à signaler"
                    if(edt) {
                        let contentList = edt.filter(
                            data => new Date(data.debut*1000).toLocaleDateString() === dayDate.toLocaleDateString()
                        ).map(
                            data => {
                                let dateDebut = new Date(data.debut*1000)
                                let dateFin = new Date(data.fin*1000)
                                return `**${data.mat}** (${data.salle})\n${data.prof}\nDe ${Utils.toTwoDigitTime(dateDebut.getHours())}:${Utils.toTwoDigitTime(dateDebut.getMinutes())} à ${Utils.toTwoDigitTime(dateFin.getHours())}:${Utils.toTwoDigitTime(dateFin.getMinutes())}`
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
