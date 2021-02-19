import { Message, PartialEmoji } from "eris";
import { LeaderboardService } from "../../../lib/database/services/game/LeaderboardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ReactionCollector } from "eris-collector";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";

export default class Leaderboards extends BaseCommand {
  names = ["leaderboards", "leaderboard", "top"];
  description = "Shows you top Zephyr players.";
  usage = ["$CMD$ <board name>"];
  allowDm = true;
  developerOnly = true;

  private leaderboardTypes = ["bits", "daily", "cards", "cubits"];

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const boardType = options[0]?.toLowerCase();
    let page = 1;
    let trueType: string;
    let totalEntries: number;
    let title: string;

    const embed = new MessageEmbed(`Leaderboards`, msg.author);

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
    } else if (["cubits", "cubit"].includes(boardType)) {
      trueType = "cubits";
      totalEntries = await LeaderboardService.getCubitLeaderboardCount();
      title = `Top players by cubits`;
    } else {
      embed.setDescription(
        `Please specify a valid leaderboard.\n` +
          `\n**Leaderboard List**` +
          `\n\`\`\`` +
          `\n${this.leaderboardTypes.join("\n")}` +
          `\n\`\`\``
      );
      await this.send(msg.channel, embed);
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
    const board = await this.send(msg.channel, embed);
    if (totalPages < 2) return;

    if (totalPages > 2) await this.react(board, `⏮`);
    if (totalPages > 1) await this.react(board, `◀`);
    if (totalPages > 1) await this.react(board, `▶`);
    if (totalPages > 2) await this.react(board, `⏭`);

    const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id;
    const collector = new ReactionCollector(this.zephyr, board, filter, {
      time: 2 * 60 * 1000,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userId: string) => {
        if (emoji.name === "⏮" && page !== 1) page = 1;
        if (emoji.name === "◀" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶" && page !== totalPages) page++;
        if (emoji.name === "⏭" && page !== totalPages) page = totalPages;

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

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr)) {
          try {
            await board.removeReaction(emoji.name, userId);
          } catch {}
        }
      }
    );
    return;
  }

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
        for (let profile of board) {
          const user = await this.zephyr.fetchUser(profile.discordId);
          leaderboard += `\`#${
            board.indexOf(profile) + 1 + (page * 10 - 10)
          }\` `;
          if (profile.private && profile.discordId !== authorId) {
            leaderboard += `*Private User*`;
          } else
            leaderboard += user ? escapeMarkdown(user.tag) : `*Unknown User*`;
          leaderboard += ` — ${this.zephyr.config.discord.emoji.bits}**${(
            profile.bits + profile.bitsBank
          ).toLocaleString()}**\n`;
        }
        break;
      }
      case "daily": {
        const board = await LeaderboardService.getDailyStreakLeaderboard(page);
        for (let profile of board) {
          const user = await this.zephyr.fetchUser(profile.discordId);
          leaderboard += `\`#${
            board.indexOf(profile) + 1 + (page * 10 - 10)
          }\` `;
          if (profile.private && profile.discordId !== authorId) {
            leaderboard += `*Private User*`;
          } else
            leaderboard += user ? escapeMarkdown(user.tag) : `*Unknown User*`;
          leaderboard += ` — **${profile.dailyStreak.toLocaleString()} days**\n`;
        }
        break;
      }
      case "cards": {
        const board = await LeaderboardService.getCardLeaderboard(
          page,
          zephyr.user.id
        );
        for (let entry of board) {
          const user = await this.zephyr.fetchUser(entry.profile.discordId);
          leaderboard += `\`#${board.indexOf(entry) + 1 + (page * 10 - 10)}\` `;
          if (entry.profile.private && entry.profile.discordId !== authorId) {
            leaderboard += `*Private User*`;
          } else
            leaderboard += user ? escapeMarkdown(user.tag) : `*Unknown User*`;
          leaderboard += ` — **${entry.count} cards**\n`;
        }
        break;
      }
      case "cubits": {
        const board = await LeaderboardService.getCubitLeaderboard(page);
        for (let profile of board) {
          const user = await this.zephyr.fetchUser(profile.discordId);
          leaderboard += `\`#${
            board.indexOf(profile) + 1 + (page * 10 - 10)
          }\` `;
          if (profile.private && profile.discordId !== authorId) {
            leaderboard += `*Private User*`;
          } else
            leaderboard += user ? escapeMarkdown(user.tag) : `*Unknown User*`;
          leaderboard += ` — **${profile.cubits.toLocaleString()}** cubits\n`;
        }
        break;
      }
    }
    return leaderboard;
  }
}
