import { Message, PartialEmoji, User } from "eris";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";
import { ReactionCollector } from "eris-collector";
import { WishlistError } from "../../../../structures/error/WishlistError";
import { Zephyr } from "../../../../structures/client/Zephyr";

export default class ClearWishlist extends BaseCommand {
  id = `handlebars`;
  names = ["wishclear", "wc"];
  usage = [`$CMD$`];
  description = "Clears your wishlist.";
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const wishlist = await ProfileService.getWishlist(profile);

    if (wishlist.length === 0) {
      const prefix = Zephyr.getPrefix(msg.guildID);
      throw new WishlistError.WishlistEmptyError(prefix);
    }

    const confirmationEmbed = new MessageEmbed(`Clear Wishlist`, msg.author)
      .setDescription(`Really clear your wishlist?`)
      .setFooter(`This action is irreversible.`);

    const confirmation = await this.send(msg.channel, confirmationEmbed);
    await this.react(confirmation, `✅`);

    const confirmed: boolean = await new Promise(async (res, _req) => {
      const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
        emoji.name === `✅` && user.id === msg.author.id;

      const collector = new ReactionCollector(Zephyr, confirmation, filter, {
        time: 30000,
        max: 1,
      });

      collector.on("error", async (e: Error) => {
        await this.handleError(msg, msg.author, e);
        res(false);
      });

      collector.on("collect", async () => {
        res(true);
      });

      collector.on("end", async (_c: any, reason: string) => {
        if (reason === "time") res(false);
      });
    });

    if (!confirmed) {
      await this.edit(
        confirmation,
        confirmationEmbed.setFooter(`🕒 This confirmation has expired.`)
      );
      return;
    }

    await this.delete(confirmation);
    await ProfileService.clearWishlist(profile);

    const embed = new MessageEmbed(`Clear Wishlist`, msg.author).setDescription(
      `Your wishlist has been cleared.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
