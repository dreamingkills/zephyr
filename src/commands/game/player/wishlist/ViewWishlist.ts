import { Message } from "eris";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { escapeMarkdown } from "../../../../lib/utility/text/TextUtils";

export default class ViewWishlist extends BaseCommand {
  names = ["wishlist", "wish", "wl"];
  usage = [`$CMD$`, `$CMD$ <@mention>`, `$CMD$ <user id>`];
  description = "Shows you someone's wishlist.";
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let targetUser, targetProfile;
    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
      targetProfile = await ProfileService.getProfile(targetUser.id);
    } else if (options[0]) {
      if (options[0].length < 17 || isNaN(parseInt(options[0]))) {
        throw new ZephyrError.InvalidSnowflakeError();
      }

      targetUser = await this.zephyr.fetchUser(options[0]);
      if (!targetUser) throw new ZephyrError.UserNotFoundError();

      targetProfile = await ProfileService.getProfile(targetUser.id);
    } else {
      targetUser = msg.author;
      targetProfile = profile;
    }

    const wishlist = await ProfileService.getWishlist(targetProfile);

    let idols = [];

    const leftPad = wishlist.length.toString().length;
    for (let idol of wishlist) {
      const groups: string[] = [];

      const applicableCards = this.zephyr
        .getCards()
        .filter((c) => c.idolId === idol.idolId);

      for (let card of applicableCards) {
        if (groups.includes(card.group || `Soloist`)) continue;

        groups.push(card.group || `Soloist`);
      }

      idols.push(
        `\`${(wishlist.indexOf(idol) + 1)
          .toString()
          .padStart(leftPad, ` `)}\` **${
          this.zephyr.getIdol(idol.idolId)?.name || `Unknown Idol`
        }** ${
          groups.length === 0 ? `` : `(${escapeMarkdown(groups.join(", "))})`
        }`
      );
    }

    const embed = new MessageEmbed(`Wishlist`, msg.author)
      .setTitle(`${targetUser.tag}'s wishlist`)
      .setDescription(
        idols.length === 0 ? `This wishlist is empty!` : `${idols.join("\n")}`
      );

    if (profile.patron < 5) {
      const prefix = this.zephyr.getPrefix(msg.guildID);
      embed.setFooter(
        `Want more slots? Become a patron!\nUse ${prefix}patreon to find out more!`
      );
    }

    await this.send(msg.channel, embed);
    return;
  }
}
