import { PrismaClient } from '@prisma/client';
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('birthday')
  .setDescription('Store or show your birthday')
  .addIntegerOption(opt =>
    opt.setName('day')
      .setDescription('The day you were born')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(31)
  )
  .addIntegerOption(opt =>
    opt.setName('month')
      .setDescription('The month you were born')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(12)
  )
  .addStringOption(opt =>
    opt.setName('timezone')
      .setDescription('Your current timezone')
      .setRequired(true)
      .addChoices(
        { name: 'UTC', value: 'UTC' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
    // Some discord.js TypeScript setups don't expose the typed getters
    // (getInteger/getString) on the options resolver. Use get(...) and
    // read .value, then coerce safely.
    const dayOpt = interaction.options.get('day', true);
    const monthOpt = interaction.options.get('month', true);
    const timezoneOpt = interaction.options.get('timezone', true);

    const day = typeof dayOpt.value === 'number' ? dayOpt.value : parseInt(String(dayOpt.value), 10);
    const month = typeof monthOpt.value === 'number' ? monthOpt.value : parseInt(String(monthOpt.value), 10);
    const timezone = String(timezoneOpt.value);

    const prisma = new PrismaClient();
    
    try {
        const guild = await prisma.guild.findUnique({
            where: { rawId: interaction.guildId! }
        });
        
        if (!guild) {
            return await interaction.reply({ 
                content: 'Guild is not recognized by Roach. Contact the server owner.', 
                ephemeral: true 
            });
        }

        await prisma.birthday.upsert({
            where: {
                userId_guildId: {
                    userId: interaction.user.id,
                    guildId: guild.id
                }
            },
            update: { day, month, timezone },
            create: {
                username: interaction.user.username,
                guildId: guild.id,
                userId: interaction.user.id,
                day,
                month,
                timezone
            }
        });

        await interaction.reply({ 
            content: `Birthday saved: ${month}/${day} (${timezone})`, 
            ephemeral: true 
        });
    } finally {
        await prisma.$disconnect();
    }
}
