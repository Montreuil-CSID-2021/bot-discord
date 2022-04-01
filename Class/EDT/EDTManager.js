const ical = require('node-ical')

const config = require('./../../config.json')
const Utils = require("../Utils");
const {MessageEmbed} = require("discord.js");
const Logs = require("../Logs");
const Course = require('./Course');

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

const EventEmitter = require('events')
const fs = require("fs");

let dir = `${__dirname}/../../data`

class EDTManager {
    static cache = {
        expire: new Date(), courses: []
    }

    static events = new EventEmitter();

    static init() {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, 0o774)
            }
            if(!fs.existsSync(`${dir}/edt.json`)) {
                fs.writeFileSync(`${dir}/edt.json`, JSON.stringify(this.cache))
            }
            let data = fs.readFileSync(`${dir}/edt.json`, 'utf-8')
            this.cache = JSON.parse(data)
            this.cache.courses = this.cache.courses.map(courseJson => {
                let course = new Course()
                course.id = courseJson.id
                course.subject = courseJson.subject
                course.type = courseJson.type
                course.location = courseJson.location
                course.teacher = courseJson.teacher
                course.start = new Date(courseJson.start)
                course.end = new Date(courseJson.end)
                return course
            })
            this.cache.expire = new Date(this.cache.expire)
            this.autoUpdateCache()
        } catch (e) {}
    }

    static async updateCache() {
        await this.getEdt()
        Logs.info('Mise à jour du cache EDT')
    }

    static autoUpdateCache() {
        this.updateCache().then(() => {
            setInterval(async () => {
                await this.updateCache()
            }, config.iut.updateInterval)
        })
    }

    /**
     * @param Courses {Array<Course>}
     */
    static addCoursesToCache(Courses) {
        this.compareCourses(this.cache.courses, Courses)
        this.cache.courses = Courses;
        this.cache.expire = new Date((new Date()).getTime() + 3600000);
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, 0o774)
            }
            fs.writeFileSync(`${dir}/edt.json`, JSON.stringify(this.cache), 'utf8');
        } catch (e) {
            Logs.error(e);
        }
    }

    /**
     * @param {Array<Course>} oldCourses
     * @param {Array<Course>} newCourses
     */
    static compareCourses(oldCourses, newCourses) {
        let now = new Date()
        oldCourses = oldCourses.filter(oldCourse => oldCourse.end.getTime() > now.getTime())
        newCourses = newCourses.filter(newCourse => newCourse.end.getTime() > now.getTime())

        let removedCourses = oldCourses.filter(oldCourse => !newCourses.find(newCourse => newCourse.equals(oldCourse)))
        let addedCourses = newCourses.filter(newCourse => !oldCourses.find(oldCourse => oldCourse.equals(newCourse)))

        if (removedCourses.length > 0 || addedCourses.length > 0) {
            this.events.emit('coursesChange', removedCourses, addedCourses)
        }
    }

    /** @return {Promise<Array<Course>>} */
    static async getEdt() {
        const url = "https://agenda.iut.univ-paris8.fr"
        let data = await ical.async.fromURL(url, {
            auth: {
                username: config.iut.username, password: config.iut.password
            }
        })

        /** @type {Array<Course>} */
        let courses = []

        for (let k in data) {
            if (data.hasOwnProperty(k)) {
                const ev = data[k]
                if (data[k].type === "VEVENT") {
                    let course = new Course()
                    let splitSummary = ev.summary.split(/(Cours|TD|Controle)/)


                    if (splitSummary[2]) {
                        let brutData = splitSummary[2]
                        if (brutData.includes("SALLE VIDE")) {
                            course.location = "A distance"
                            brutData = brutData.replace("SALLE VIDE", "").trim()
                        } else {
                            let brutDataSplit = brutData.split(' ')
                            course.location = brutDataSplit[brutDataSplit.length - 1]
                            brutData = brutData.replace(course.location, "").trim()
                        }

                        if (brutData.includes('PROF VIDE')) {
                            course.teacher = "En autonomie"
                        } else {
                            course.teacher = brutData + (brutData.includes('NAUWYNCK') ? " ⚰" : "")
                        }
                    }

                    course.id = ev.uid
                    course.subject = splitSummary[0]?.trim()
                    course.type = splitSummary[1]?.trim()
                    course.start = new Date(ev.start)
                    course.end = new Date(ev.end)

                    courses.push(course)
                }
            }
        }

        this.addCoursesToCache(courses)
        return courses
    }

    /** @param {Date} dateOfWeek */
    static async getEmbedEDT(dateOfWeek) {
        let dateToFetch = Utils.getMondayOfWeek(dateOfWeek)

        let result = null
        let brutCourses = null

        if(this.cache.expire.getTime() > (new Date()).getTime()) {
            brutCourses = this.cache.courses
            console.log("Using cache")
        } else {
            brutCourses = await this.getEdt()
        }

        let weekDate = dateToFetch
        let weekDateEnd = new Date(((dateToFetch.getTime() / 1000) + (86400 * 4)) * 1000)
        let weedDateEndPlusOne = new Date(((dateToFetch.getTime() / 1000) + (86400 * 5)) * 1000)

        let courses = brutCourses.filter(course => {
            return course.start.getTime() >= weekDate.getTime() && course.start.getTime() <= weedDateEndPlusOne.getTime()
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
            if (courses) {
                // check if is the same date
                let contentList = courses.filter(data => data.start.getDate() === dayDate.getDate() && data.start.getMonth() === dayDate.getMonth() && data.start.getFullYear() === dayDate.getFullYear()).map(data => {
                    return `**${data.subject} - ${data.type}** (${data.location})\n${data.teacher}\nDe ${Utils.toTwoDigitTime(data.start.getHours())}:${Utils.toTwoDigitTime(data.start.getMinutes())} à ${Utils.toTwoDigitTime(data.end.getHours())}:${Utils.toTwoDigitTime(data.end.getMinutes())}`
                })

                if (contentList.length > 0) content = contentList.join("\n\n")
            }
            embed.addField(`📅 ${daysOfWeek[i]}`, content)
        }
        result = embed

        return result
    }
}

module.exports = EDTManager
