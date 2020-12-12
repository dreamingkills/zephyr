import { Message, PartialEmoji } from "eris";
import { LeaderboardService } from "../../../lib/database/services/game/LeaderboardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ReactionCollector } from "eris-collector";
import { StatisticsService } from "../../../lib/database/services/statistics/StatisticsService";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class Leaderboards extends BaseCommand {
  names = ["leaderboards", "leaderboard", "top"];
  description = "Shows you top Zephyr players.";
  usage = ["$CMD$ <board name>"];

  private leaderboardTypes = ["bits", "daily", "cards"];

  private async getLeaderboard(
    type: string,
    page: number,
    authorId: string,
    zephyr: Zephyr
  ): Promise<string> {
    let leaderboard = "";
    switch (type) {
      case "bits": {
        const board = await LeaderboardService.getBitLeaderboard(page);
        for (let user of board) {
          const discordUser = await this.zephyr.fetchUser(user.discordId);
          leaderboard += `\`#${board.indexOf(user) + 1 + (page * 10 - 10)}\` `;
          if (user.private && user.discordId !== authorId) {
            leaderboard += `*Private User*`;
          } else leaderboard += discordUser.tag;
          leaderboard += ` — ${this.zephyr.config.discord.emoji.bits}**${(
            user.bits + user.bitsBank
          ).toLocaleString()}**\n`;
        }
        break;
      }
      case "daily": {
        const board = await LeaderboardService.getDailyStreakLeaderboard(page);
        for (let user of board) {
          const discordUser = await this.zephyr.fetchUser(user.discordId);
          leaderboard += `\`#${board.indexOf(user) + 1 + (page * 10 - 10)}\` `;
          if (user.private && user.discordId !== authorId) {
            leaderboard += `*Private User*`;
          } else leaderboard += discordUser.tag;
          leaderboard += ` — **${user.dailyStreak.toLocaleString()} days**\n`;
        }
        break;
      }
      case "cards": {
        const board = await LeaderboardService.getCardLeaderboard(
          page,
          zephyr.user.id
        );
        for (let entry of board) {
          const discordUser = await this.zephyr.fetchUser(
            entry.profile.discordId
          );
          leaderboard += `\`#${board.indexOf(entry) + 1 + (page * 10 - 10)}\` `;
          if (entry.profile.private && entry.profile.discordId !== authorId) {
            leaderboard += `*Private User*`;
          } else leaderboard += discordUser.tag;
          leaderboard += ` — **${entry.count} cards**\n`;
        }
        break;
      }
    }
    return leaderboard;
  }

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const boardType = this.options[0]?.toLowerCase();
    let page = 1;
    let trueType: string;
    let totalEntries: number;
    let title: string;

    const embed = new MessageEmbed().setAuthor(
      `Leaderboards | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );

    if (["bit", "bits", "b"].includes(boardType)) {
      trueType = "bits";
      totalEntries = await LeaderboardService.getBitLeaderboardCount();
      title = `Top players by bits`;
    } else if (["daily", "d", "streak"].includes(boardType)) {
      trueType = "daily";
      totalEntries = await LeaderboardService.getDailyStreakLeaderboardCount();
      title = `Top players by daily streak length`;
    } else if (["cards", "c", "card"].includes(boardType)) {
      trueType = "cards";
      totalEntries = await LeaderboardService.getCardLeaderboardCount(
        this.zephyr
      );
      title = `Top players by card collection`;
    } else {
      embed.setDescription(
        `Please specify a valid leaderboard.\n` +
          `\n**Leaderboard List**` +
          `\n\`\`\`` +
          `\n${this.leaderboardTypes.join("\n")}` +
          `\n\`\`\``
      );
      await msg.channel.createMessage({ embed });
      return;
    }

    const totalPages = Math.ceil(totalEntries / 10);

    embed.setTitle(
      title +
        ` (${1 + 10 * page - 10}-${
          10 * page > totalEntries ? totalEntries : 10 * page
        })`
    );
    embed.setDescription(
      await this.getLeaderboard(trueType, page, msg.author.id, this.zephyr)
    );
    embed.setFooter(`Page ${page} of ${totalPages} • ${totalEntries} entries`);
    const board = await msg.channel.createMessage({ embed });
    if (totalPages < 2) return;

    if (totalPages > 2) board.addReaction(`⏮️`);
    if (totalPages > 1) board.addReaction(`◀️`);
    // board.addReaction(`🔢`),
    if (totalPages > 1) board.addReaction(`▶️`);
    if (totalPages > 2) board.addReaction(`⏭️`);

    const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id;
    const collector = new ReactionCollector(this.zephyr, board, filter, {
      time: 2 * 60 * 1000,
    });
    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userId: string) => {
        if (emoji.name === "⏮️" && page !== 1) page = 1;
        if (emoji.name === "◀️" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶️" && page !== totalPages) page++;
        if (emoji.name === "⏭️" && page !== totalPages) page = totalPages;

        embed.setTitle(
          title +
            ` (${1 + 10 * page - 10}-${
              10 * page > totalEntries ? totalEntries : 10 * page
            })`
        );
        embed.setDescription(
          await this.getLeaderboard(trueType, page, msg.author.id, this.zephyr)
        );
        embed.setFooter(
          `Page ${page} of ${totalPages} • ${totalEntries} entries`
        );
        await board.edit({ embed });

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr))
          await board.removeReaction(emoji.name, userId);
      }
    );
    return;
  }
}
