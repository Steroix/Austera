require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, REST, Routes } = require('discord.js');

// .env dosyasından token al
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN .env dosyasında tanımlı değil!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // For guild-related events
        GatewayIntentBits.GuildMessages, // For message events in guilds
        GatewayIntentBits.MessageContent // For reading message content
    ]
});

const clientId = '1357752438106624061'; // Botunuzun Client ID'si
const guildId = '1176966070612004896'; // Sunucu ID'si
const ownerId = '268501021037166592'; // Bot sahibinin Discord kullanıcı ID'si

const commands = [
    {
        name: 'ozeloda',
        description: 'Özel bir oda oluşturur.',
    },
    {
        name: 'odasil',
        description: 'Bulunduğunuz özel odayı siler.',
    },
    {
        name: 'easteregg',
        description: 'Gizli bir easter egg komutu.',
    }
];

// Kullanıcıların özel odalarını takip etmek için bir Map
const userPrivateRooms = new Map();

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

        // Kullanıcının zaten bir özel odası var mı kontrol et
        if (userPrivateRooms.has(author.id)) {
            return interaction.reply("Zaten bir özel odanız var!");
        }

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
        const adminRoles = ["Admin", "Moderator", "Yönetici", "admin"]; // Replace with your server's admin roles
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

            // Kullanıcının özel odasını kaydet
            userPrivateRooms.set(author.id, channel.id);

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

        // Kullanıcının yetkili olup olmadığını kontrol et
        const member = interaction.member; // Kullanıcıyı doğrudan interaction'dan al
        const adminRoles = ["Admin", "Moderator", "Yönetici", "admin"]; // Yetkili rollerin isimleri
        const isAuthorized = member.roles.cache.some(role => adminRoles.includes(role.name));

        if (!isAuthorized) {
            await interaction.reply("Bu komutu yalnızca yetkililer kullanabilir.");
            return;
        }

        await interaction.reply("Oda silme işlemi başlatılıyor...");

        try {
            // Kullanıcının özel odasını Map'ten kaldır
            userPrivateRooms.forEach((value, key) => {
                if (value === channel.id) {
                    userPrivateRooms.delete(key);
                }
            });

            await channel.delete("Yetkili tarafından silindi.");
            console.log(`Kanal silindi: ${channel.name}`);
        } catch (error) {
            console.error('Kanal silinirken bir hata oluştu:', error);
            interaction.followUp("Kanal silinirken bir hata oluştu.");
        }
    }

    if (commandName === 'easteregg') {
        const specialUserId = '268501021037166592'|| '320325708154929155'; // Özel kullanıcı ID'si
        if (interaction.user.id === specialUserId) {
            return interaction.reply("🎉 Tebrikler! Gizli bir easter egg buldunuz! 🎉");
        }
        return interaction.reply("Bu komut bir şey yapmıyor gibi görünüyor... 🤔");
    }
});

client.login(BOT_TOKEN);
