const EDTManager = require('./../Class/EDT/EDTManager')

module.exports = {
    name: "edt",
    description: "Récupération de l'emploi du temps",
    enable: true,
    roles: ["etudiant"],
    options: [
        {
            name: "date",
            type: "STRING",
            description: "Date de la semaine souhaité au format JJ/MM/AAAA",
            required: false
        }
        // se référer à la doc de l'api discord :
        // https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure
    ],
    async execute(interaction) {
        let inputDate = interaction.options.getString('date', false)
        let date = null

        try {
            if(inputDate) {
                let splitInputDate = inputDate.split('/')

                if(splitInputDate.length === 3) {

                        let dateOfInput = new Date()
                        dateOfInput.setFullYear(Number.parseInt(splitInputDate[2]), Number.parseInt(splitInputDate[1])-1, Number.parseInt(splitInputDate[0]))
                        date = dateOfInput
                }
            } else date = new Date()
        } catch (e) {console.error(e)}

        if(!date) return interaction.reply("Date invalide")

        await interaction.deferReply()

        await EDTManager.getEmbedEDT(date).then((embed) => {
            if(embed) {
                interaction.editReply({embeds: [embed]})
            } else interaction.editReply("Erreur lors de la récupération de l'emploi du temps")
        }).catch(() => {
            interaction.editReply("Erreur lors de la récupération de l'emploi du temps")
        })
    }
}
