module.exports = {
    name: "ping",
    description: "Latence du Bot et de l'API Discord",
    enable: true,
    roles: ["etudiant"],
    async execute(interaction) {
        await interaction.reply({content: `🏓 Ping . . .`})

        /** @type {any} */
        let msg = await interaction.fetchReply()

        await interaction.editReply(`Pong! 🏓\nLatence : ${Math.floor(msg.createdAt - interaction.createdAt)}ms\nLatence API : ${Math.round(interaction.client.ws.ping)}ms`)
    }
}
