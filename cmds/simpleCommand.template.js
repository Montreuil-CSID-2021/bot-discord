module.exports = {
    name: "nom_command",
    description: "description de la commande",
    enable: true,
    roles: ["etudiant"],
    options: [
        // se référer à la doc de l'api discord :
        // https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure
    ],
    async execute(interaction) {
        // Code à exécuter
    }
}
