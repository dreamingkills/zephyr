import { Message } from "eris";
import { LeaderboardService } from "../../../lib/database/services/game/LeaderboardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class Leaderboards extends BaseCommand {
  names = ["leaderboards", "leaderboard", "top"];
  description = "Shows you top Zephyr players.";
  usage = ["$CMD$ <board name>"];

  private leaderboardTypes = ["bits"];
  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const boardType = this.options[0]?.toLowerCase();

    const embed = new MessageEmbed().setAuthor(
      `Leaderboards | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );
    let desc = ``;
    if (["bit", "bits", "b"].includes(boardType)) {
      const board = await LeaderboardService.getBitLeaderboard();
      for (let user of board) {
        const discordUser = await this.zephyr.fetchUser(user.discordId);
        desc +=
          `\`#${board.indexOf(user) + 1}\` ` +
          `${user.private ? `*Private User*` : discordUser.tag} ` +
          `— ${
            this.zephyr.config.discord.emoji.bits
          }**${user.bits.toLocaleString()}**\n`;
      }
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

    embed.setDescription(desc);
    await msg.channel.createMessage({ embed });
    return;
  }
}
