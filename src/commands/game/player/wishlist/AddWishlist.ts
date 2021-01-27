import { Message } from "eris";
import { ProfileService } from "../../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../../structures/command/Command";
import { GameProfile } from "../../../../structures/game/Profile";
import * as ZephyrError from "../../../../structures/error/ZephyrError";
import { GameIdol } from "../../../../structures/game/Idol";
import { MessageCollector } from "eris-collector";

export default class AddWishlist extends BaseCommand {
  names = ["wishadd", "wa"];
  description = "Adds an idol to your wishlist.";
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const wishlist = await ProfileService.getWishlist(profile);

    if (
      (wishlist.length >= 5 && profile.patron === 0) ||
      (wishlist.length >= 10 && profile.patron === 1) ||
      (wishlist.length >= 15 && profile.patron === 2) ||
      (wishlist.length >= 20 && profile.patron === 3) ||
      (wishlist.length >= 25 && profile.patron === 4)
    ) {
      const prefix = this.zephyr.getPrefix(msg.guildID!);
      throw new ZephyrError.WishlistFullError(profile.patron, prefix);
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
      throw new ZephyrError.InvalidWishlistNameError();
    } else if (matches.length === 1) {
      additionTarget = matches[0];
    } else {
      const embed = new MessageEmbed(`Wishlist Add`, msg.author).setDescription(
        `I found multiple matches for \`${nameQuery}\`.\nPlease choose a number corresponding to the desired idol.\n${matches
          .map((u, index) => {
            const groups: string[] = [];
            this.zephyr
              .getCards()
              .filter((c) => c.idolId === u.id)
              .map((c) => c.group)
              .forEach((g) => {
                if (!groups.includes(g || `Soloist`))
                  groups.push(g || `Soloist`);
              });

            return `— \`${index + 1}\` **${u.name}**${
              groups.length === 0 ? `` : ` (${groups.join(`, `)})`
            }`;
          })
          .join("\n")}`
      );

      const conf = await this.send(msg.channel, embed);

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
        await conf.edit({
          embed: embed.setFooter(`🕒 This search has timed out.`),
        });
        return;
      }

      additionTarget = choice;
      await conf.delete();
    }

    const exists = wishlist.find((wl) => wl.idolId === additionTarget.id);

    const groups: string[] = [];
    this.zephyr
      .getCards()
      .filter((c) => c.idolId === additionTarget.id)
      .map((c) => c.group)
      .forEach((g) => {
        if (!groups.includes(g || `Soloist`)) groups.push(g || `Soloist`);
      });

    if (exists)
      throw new ZephyrError.DuplicateWishlistEntryError(additionTarget, groups);

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
