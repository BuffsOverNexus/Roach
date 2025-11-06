import { Birthday, PrismaClient } from "@prisma/client";
import { Client, TextBasedChannel } from "discord.js";

/**
 * Send birthday messages for users whose birthday matches today's UTC date.
 *
 * - Queries guilds that have birthday messages enabled and a configured channel.
 * - Sends one message per birthday in the guild's configured channel.
 *
 * This function is intentionally resilient: it logs and continues on per-guild
 * and per-message failures so a single error doesn't stop the whole job.
 */
export default async function birthdayCronJob(prisma: PrismaClient, client: Client): Promise<void> {
  try {
    // Retrieve guilds that have birthday messaging enabled and a channel set
    const guildsWithBirthdays = await prisma.guild.findMany({
      where: {
        sendBirthdayMessages: true,
        birthdayChannelId: { not: null },
      },
      include: {
        birthdays: true,
      },
    });

    const now = new Date();
    const utcMonth = now.getUTCMonth() + 1; // getUTCMonth is zero-based
    const utcDay = now.getUTCDate();

    if (!guildsWithBirthdays.length) {
      // Nothing to do
      return;
    }

    for (const guild of guildsWithBirthdays) {
      if (!guild.birthdayChannelId) continue; // defensive

      const birthdaysToday: Birthday[] = guild.birthdays.filter(
        (b) => b.month === utcMonth && b.day === utcDay
      );

      if (birthdaysToday.length === 0) continue;

      let channel: TextBasedChannel | null = null;
      try {
        const fetched = await client.channels.fetch(guild.birthdayChannelId);
        if (!fetched || !fetched.isTextBased()) {
          console.warn(`Configured birthday channel ${guild.birthdayChannelId} for guild ${guild.rawId} is not text-based or could not be fetched.`);
          continue;
        }
        channel = fetched as TextBasedChannel;
      } catch (err) {
        console.error(`Failed to fetch channel ${guild.birthdayChannelId} for guild ${guild.rawId}:`, err);
        continue;
      }

      // Send messages sequentially with a small delay between sends to be
      // rate-limit friendly. The delay (ms) can be configured via
      // BIRTHDAY_MESSAGE_DELAY_MS env var; default to 500ms.
      const delayMs = Number(process.env.BIRTHDAY_MESSAGE_DELAY_MS) || 500;

      for (const birthday of birthdaysToday) {
        try {
          if (!channel) throw new Error('No channel available');
          if (typeof (channel as any).send !== 'function') {
            throw new Error('Channel does not support sending messages');
          }

          await (channel as any).send(`Happy Birthday ${sanitizeUsername(birthday.username)}! 🎉`);
        } catch (err) {
          console.error(`Failed to send birthday message for user ${birthday.userId} in guild ${guild.rawId}:`, err);
        }

        // Wait between messages to reduce the chance of hitting rate limits.
        // If delayMs is 0, this is essentially a no-op.
        if (delayMs > 0) await sleep(delayMs);
      }
    }
  } catch (err) {
    console.error('Birthday cron job failed:', err);
  }
}

/**
 * Sanitize a username for safe output in chat. Minimizes accidental mentions or markdown.
 */
function sanitizeUsername(username: string): string {
  // Prevent mention pings and escape markdown characters
  return username.replace(/@/g, '@\u200b').replace(/([*_`~|>])/g, '\\$1');
}

/**
 * Simple sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}