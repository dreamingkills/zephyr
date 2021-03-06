import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";
import {
  escapeMarkdown,
  getGroupsByIdolId,
} from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class TopWishlist extends BaseCommand {
  id = `within`;
  names = ["topwishlist", "twl"];
  description = "Shows you the top cards by number of wishlists.";
  usage = ["$CMD$"];
  allowDm = true;

  private async renderBody(
    top: { idol_id: number; count: number }[],
    page: number
  ): Promise<string> {
    let description = "";
    const pad = `#${page * 10}`.length;
    for (let t of top) {
      const idol = Zephyr.getIdol(t.idol_id);

      const groups = getGroupsByIdolId(idol?.id || 0, Zephyr.getCards());

      description += `\`${(
        `#` + (page * 10 - 10 + top.indexOf(t) + 1).toString()
      ).padStart(pad, " ")}\` ${`**${idol?.name || `Unknown Idol`}**${
        groups.length === 0 ? `` : ` (${escapeMarkdown(groups.join(`, `))})`
      }`} — **${t.count.toLocaleString()}** wishlists\n`;
    }
    return description;
  }

  async exec(msg: Message): Promise<void> {
    let page = 1;
    const topWishlistedCount = await CardService.getNumberOfTopWishlisted();
    const topWishlisted = await CardService.getTopWishlisted(page);

    const totalPages = Math.ceil(topWishlistedCount / 10);

    const title = `Top wishlisted cards`;
    const embed = new MessageEmbed(`Top Wishlist`, msg.author)
      .setTitle(
        `${title} (${1 + 10 * page - 10}-${
          10 * page > topWishlistedCount ? topWishlistedCount : 10 * page
        })`
      )
      .setDescription(await this.renderBody(topWishlisted, page))
      .setFooter(
        `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${topWishlistedCount.toLocaleString()} entries`
      );
    const board = await this.send(msg.channel, embed);

    if (totalPages < 2) return;

    // if (totalPages > 2) await this.react(board, `⏮`);
    if (totalPages > 1) await this.react(board, `◀`);
    if (totalPages > 1) await this.react(board, `▶`);
    // if (totalPages > 2) await this.react(board, `⏭`);

    const filter = (_m: Message, _emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id;

    const collector = new ReactionCollector(Zephyr, board, filter, {
      time: 2 * 60 * 1000,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, msg.author, e);
    });

    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, user: User) => {
        if (emoji.name === "⏮" && page !== 1) page = 1;
        if (emoji.name === "◀" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶" && page !== totalPages) page++;
        if (emoji.name === "⏭" && page !== totalPages) page = totalPages;

        const newTopWishlisted = await CardService.getTopWishlisted(page);
        embed.setTitle(
          `${title} (${1 + 10 * page - 10}-${
            10 * page > topWishlistedCount ? topWishlistedCount : 10 * page
          })`
        );
        embed.setDescription(await this.renderBody(newTopWishlisted, page));
        embed.setFooter(
          `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${topWishlistedCount.toLocaleString()} entries`
        );
        await board.edit({ embed });

        if (checkPermission("manageMessages", msg.textChannel))
          await board.removeReaction(emoji.name, user.id);
      }
    );
    return;
  }
}
