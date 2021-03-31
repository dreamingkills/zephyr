import { Message } from "eris";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameIdol } from "../../../../structures/game/Idol";
import { MessageCollector } from "eris-collector";
import { getGroupsByIdolId } from "../../../../lib/utility/text/TextUtils";
import { WishlistError } from "../../../../structures/error/WishlistError";

export default class AddWishlist extends BaseCommand {
  id = `permatrip`;
  names = ["wishadd", "wa"];
  description = "Adds an idol to your wishlist.";
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidIdolError();
    const wishlist = await ProfileService.getWishlist(profile);

    const max = 5 + profile.patron * 5;

    if (wishlist.length > max) {
      const prefix = this.zephyr.getPrefix(msg.guildID!);
      throw new WishlistError.WishlistFullError(prefix);
    }

    const nameQuery = options.join(" ").toLowerCase();
    const matches: GameIdol[] = [];

    this.zephyr
      .getCards()
      .filter((c) => `${c.group} ${c.name}`.toLowerCase().includes(nameQuery))
      .forEach((m) => {
        if (!matches.find((match) => m.idolId === match.id))
          matches.push(
            new GameIdol({
              id: m.idolId,
              idol_name: m.name,
              birthday: m.birthday,
            })
          );
      });

    if (matches.length > 25) throw new ZephyrError.LookupQueryTooBroadError();

    let additionTarget: GameIdol;

    if (matches.length === 0) {
      throw new ZephyrError.InvalidIdolError();
    } else if (matches.length === 1) {
      additionTarget = matches[0];
    } else {
      const embed = new MessageEmbed(`Wishlist Add`, msg.author).setDescription(
        `I found multiple matches for \`${nameQuery}\`.\nPlease choose a number corresponding to the desired idol.\n${matches
          .map((u, index) => {
            const groups = getGroupsByIdolId(u.id, this.zephyr.getCards());

            return `— \`${index + 1}\` **${u.name}**${
              groups.length === 0 ? `` : ` (${groups.join(`, `)})`
            }`;
          })
          .join("\n")}`
      );

      const confirmation = await this.send(msg.channel, embed);

      const choice: GameIdol | undefined = await new Promise(
        async (res, _req) => {
          const filter = (m: Message) =>
            matches[parseInt(m.content, 10) - 1] &&
            m.author.id === msg.author.id;

          const collector = new MessageCollector(
            this.zephyr,
            msg.channel,
            filter,
            {
              time: 30000,
              max: 1,
            }
          );
          collector.on("error", async (e: Error) => {
            await this.handleError(msg, e);
          });

          collector.on("collect", async (m: Message) => {
            const index = matches[parseInt(m.content, 10) - 1];

            if (!index) res(undefined);

            res(index);
          });

          collector.on("end", async (_c: any, reason: string) => {
            if (reason === "time") res(undefined);
          });
        }
      );

      if (!choice) {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This search has timed out.`),
        });
        return;
      }

      additionTarget = choice;
      await this.delete(confirmation);
    }

    const groups = getGroupsByIdolId(additionTarget.id, this.zephyr.getCards());

    const refetchWishlist = await ProfileService.getWishlist(profile);

    if (refetchWishlist.length >= max) {
      const prefix = this.zephyr.getPrefix(msg.guildID);
      throw new WishlistError.WishlistFullError(prefix);
    }

    const exists = refetchWishlist.find(
      (wl) => wl.idolId === additionTarget.id
    );

    if (exists) {
      const prefix = this.zephyr.getPrefix(msg.guildID);
      throw new WishlistError.WishlistDuplicateError(additionTarget, prefix);
    }

    await ProfileService.addToWishlist(profile, additionTarget.id);

    const embed = new MessageEmbed(`Wishlist Add`, msg.author).setDescription(
      `Added **${additionTarget.name}**${
        groups.length === 0 ? `` : ` (${groups.join(`, `)})`
      } to your wishlist.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
