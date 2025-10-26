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
    const day = interaction.options.getInteger('day', true);
    const month = interaction.options.getInteger('month', true);
    const timezone = interaction.options.getString('timezone', true);

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
