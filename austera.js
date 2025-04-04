require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, REST, Routes } = require('discord.js');
const BOT_TOKEN = process.env.BOT_TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // For guild-related events
        GatewayIntentBits.GuildMessages, // For message events in guilds
        GatewayIntentBits.MessageContent // For reading message content
    ]
});

const clientId = '1357752438106624061'; // Botunuzun Client ID'si
const guildId = '859939115877531678'; // Sunucu ID'si
const ownerId = '859939115877531678'; // Bot sahibinin Discord kullanıcı ID'si

const commands = [
    {
        name: 'ozeloda',
        description: 'Özel bir oda oluşturur.',
    },
    {
        name: 'odasil',
        description: 'Bulunduğunuz özel odayı siler.',
    }
];

// Bot token'ını güvenli bir şekilde saklayın (örneğin, bir .env dosyasında)

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
    try {
        console.log('Slash komutları kaydediliyor...');
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('Slash komutları başarıyla kaydedildi.');
    } catch (error) {
        console.error('Slash komutları kaydedilirken bir hata oluştu:', error);
    }
})();

client.once('ready', () => {
    console.log(`${client.user.tag} is ready!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ozeloda') {
        const guild = interaction.guild;
        const author = interaction.user;

        // Create a private channel visible only to the user and admins
        const overwrites = [
            {
                id: guild.roles.everyone.id, // Everyone else can't see
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: author.id, // User can see
                allow: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: client.user.id, // Bot can see
                allow: [PermissionsBitField.Flags.ViewChannel]
            }
        ];

        // Add "Admin" roles (adjust role names as needed)
        const adminRoles = ["Admin", "Moderator", "Yönetici", "Botates"]; // Replace with your server's admin roles
        guild.roles.cache.forEach(role => {
            if (adminRoles.includes(role.name)) {
                overwrites.push({
                    id: role.id,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                });
            }
        });

        // Create the channel
        try {
            const channel = await guild.channels.create({
                name: `özel-${author.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: overwrites,
                reason: `Private channel for ${author.username}`
            });

            await interaction.reply(`${author}, özel odan oluşturuldu: ${channel}`);
        } catch (error) {
            console.error('Kanal oluşturulurken bir hata oluştu:', error);
            await interaction.reply("Bir hata oluştu, özel oda oluşturulamadı.");
        }
    }

    if (commandName === 'odasil') {
        const channel = interaction.channel;

        // Check if the channel name starts with "özel-"
        if (!channel.name.startsWith("özel-")) {
            return interaction.reply("Bu komut yalnızca özel odalarda kullanılabilir.");
        }

        try {
            await channel.delete("Kullanıcı tarafından silindi.");
            console.log(`Kanal silindi: ${channel.name}`);
        } catch (error) {
            console.error('Kanal silinirken bir hata oluştu:', error);
            interaction.reply("Kanal silinirken bir hata oluştu.");
        }
    }

    if (commandName === 'shutdown') {
        if (interaction.user.id !== ownerId) {
            return interaction.reply("Bu komutu yalnızca bot sahibi kullanabilir.");
        }

        await interaction.reply("Bot kapatılıyor...");
        client.destroy();
    }
});

client.login(BOT_TOKEN);