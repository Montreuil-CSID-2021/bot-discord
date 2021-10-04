module.exports = {
    name: "nom_command",
    description: "description de la commande",
    enable: true,
    roles: ["etudiant"],
    subCommands: [
        {
            name: "nom_sous_command",
            description: "description de la sous commande",
            enable: true,
            options: [
                // se référer à la doc de l'api discord :
                // https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure
            ],
            async execute(interaction) {
                // Code à exécuter
            }
        }
    ],
    subCommandGroups: [
        {
            name: "nom_groupe_sous_command",
            description: "description du groupe de sous commande",
            enable: true,
            subCommands: [
                {
                    name: "nom_sous_command",
                    description: "description de la sous commande",
                    enable: true,
                    options: [
                        // se référer à la doc de l'api discord :
                        // https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure
                    ],
                    async execute(interaction) {
                        // Code à exécuter
                    }
                }
            ]
        }
    ]
}



