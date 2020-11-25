import { Message, PartialEmoji } from "eris";
import { LeaderboardService } from "../../../lib/database/services/game/LeaderboardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ReactionCollector } from "eris-collector";
import { StatisticsService } from "../../../lib/database/services/statistics/StatisticsService";

export default class Leaderboards extends BaseCommand {
  names = ["leaderboards", "leaderboard", "top"];
  description = "Shows you top Zephyr players.";
  usage = ["$CMD$ <board name>"];

  private leaderboardTypes = ["bits", "daily"];

  private async getLeaderboard(type: string, page: number): Promise<string> {
    let leaderboard = "";
    switch (type) {
      case "bits": {
        const board = await LeaderboardService.getBitLeaderboard(page);
        for (let user of board) {
          const discordUser = await this.zephyr.fetchUser(user.discordId);
          leaderboard +=
            `\`#${board.indexOf(user) + 1 + (page * 10 - 10)}\` ` +
            `${user.private ? `*Private User*` : discordUser.tag} ` +
            `— ${
              this.zephyr.config.discord.emoji.bits
            }**${user.bits.toLocaleString()}**\n`;
        }
        break;
      }
      case "daily": {
        const board = await LeaderboardService.getDailyStreakLeaderboard(page);
        for (let user of board) {
          const discordUser = await this.zephyr.fetchUser(user.discordId);
          leaderboard +=
            `\`#${board.indexOf(user) + 1 + (page * 10 - 10)}\` ` +
            `${user.private ? `*Private User*` : discordUser.tag} ` +
            `— **${user.dailyStreak.toLocaleString()} days**\n`;
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
      totalEntries = await StatisticsService.getNumberOfProfiles();
      title = `Top players by bits`;
    } else if (["daily", "d", "streak"].includes(boardType)) {
      trueType = "daily";
      totalEntries = await StatisticsService.getNumberOfProfiles();
      title = `Top players by daily streak length`;
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

    embed.setTitle(title + ` (${1 + 10 * page - 10}-${10 * page})`);
    embed.setDescription(await this.getLeaderboard(trueType, page));
    embed.setFooter(`Page ${page} of ${totalPages} • ${totalEntries} entries`);
    const board = await msg.channel.createMessage({ embed });

    Promise.all([
      board.addReaction(`⏮️`),
      board.addReaction(`◀️`),
      // board.addReaction(`🔢`),
      board.addReaction(`▶️`),
      board.addReaction(`⏭️`),
    ]);

    const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id;
    const collector = new ReactionCollector(this.zephyr, board, filter, {
      time: 5 * 60 * 1000,
    });
    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userId: string) => {
        if (emoji.name === "⏮️" && page !== 1) page = 1;
        if (emoji.name === "◀️" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶️" && page !== totalPages) page++;
        if (emoji.name === "⏭️" && page !== totalPages) page = totalPages;

        embed.setTitle(title + ` (${1 + 10 * page - 10}-${10 * page})`);
        embed.setDescription(await this.getLeaderboard(trueType, page));
        embed.setFooter(
          `Page ${page} of ${totalPages} • ${totalEntries} entries`
        );
        await board.edit({ embed });

        if (this.zephyr.checkPermission("manageMessages", msg.textChannel))
          await board.removeReaction(emoji.name, userId);
      }
    );
    return;
  }
}
