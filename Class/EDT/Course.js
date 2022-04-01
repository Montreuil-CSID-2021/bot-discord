class Course {
    /** @type string */
    id

    subject = "Inconnu"

    type = "Inconnu"

    location = "Inconnu"

    teacher = "Inconnu"

    start = new Date()

    end = new Date()

    equals(other) {
        return this.subject === other.subject &&
            this.type === other.type &&
            this.location === other.location &&
            this.teacher === other.teacher &&
            this.start.getTime() === other.start.getTime() &&
            this.end.getTime() === other.end.getTime()
    }
}

module.exports = Course
