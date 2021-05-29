import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { getUserClubMembership } from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class MyClubs extends BaseCommand {
  id = `basket`;
  names = [`myclubs`];
  description = `Shows a list of clubs you're a member of.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const clubs = await getUserClubMembership(profile);

    const embed = new MessageEmbed(`My Clubs`, msg.author).setDescription(
      `${msg.author.tag}'s clubs`
    );

    if (clubs.length === 0) {
      const prefix = Zephyr.getPrefix(msg.guildID);

      embed.setDescription(
        `**You aren't a member of any clubs!**\nUse \`${prefix}join <club name>\` to join one!`
      );

      await this.send(msg.channel, embed);
    }

    embed.setDescription(
      clubs
        .map(
          (club) =>
            `**${escapeMarkdown(club.name)}** - ${
              club.ownerId === msg.author.id ? `Owner` : `Member`
            }`
        )
        .join(`\n`)
    );

    await this.send(msg.channel, embed);
    return;
  }
}
