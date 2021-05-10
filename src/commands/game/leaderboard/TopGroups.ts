import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class TopGroup extends BaseCommand {
  id = `emotion`;
  names = ["topgroup", "tg"];
  description = "Shows you the top collectors of a certain group.";
  usage = ["$CMD$ <group name>"];
  allowDm = true;
  developerOnly = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const groupRaw = options.join(" ").toLowerCase();
    if (!groupRaw) throw new ZephyrError.UnspecifiedGroupError();

    const match = Zephyr.getCards().filter(
      (c) => c.group && c.group.toLowerCase() === groupRaw
    )[0];
    if (!match || !match.group) throw new ZephyrError.InvalidGroupError();

    const group = match.group;
    const ids = Zephyr.getCards()
      .filter((c) => c.group === group)
      .map((c) => c.id);

    let page = 1;
    const topCollectorCount = await CardService.getNumberOfTopCollectors(ids);
    const topCollectors = await CardService.getTopCollectorsByBaseIds(
      ids,
      page
    );

    const totalPages = Math.ceil(topCollectorCount / 10);

    const title = `Top collectors of ${group} `;
    const embed = new MessageEmbed(`Top Collectors`, msg.author)
      .setTitle(
        `${title} (${1 + 10 * page - 10}-${
          10 * page > topCollectorCount ? topCollectorCount : 10 * page
        })`
      )
      .setDescription(await this.renderBody(topCollectors, page, profile))
      .setFooter(
        `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${topCollectorCount.toLocaleString()} entries`
      );
    const board = await this.send(msg.channel, embed);

    if (totalPages < 2) return;

    if (totalPages > 2) await this.react(board, `⏮`);
    if (totalPages > 1) await this.react(board, `◀`);
    if (totalPages > 1) await this.react(board, `▶`);
    if (totalPages > 2) await this.react(board, `⏭`);

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

        const newTopCollectors = await CardService.getTopCollectorsByBaseIds(
          ids,
          page
        );
        embed.setTitle(
          `${title} (${1 + 10 * page - 10}-${
            10 * page > topCollectorCount ? topCollectorCount : 10 * page
          })`
        );
        embed.setDescription(
          await this.renderBody(newTopCollectors, page, profile)
        );
        embed.setFooter(
          `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${topCollectorCount.toLocaleString()} entries`
        );
        await board.edit({ embed });

        if (checkPermission("manageMessages", msg.textChannel))
          await board.removeReaction(emoji.name, user.id);
      }
    );
    return;
  }

  private async renderBody(
    collectors: { discordId: string; amount: number }[],
    page: number,
    sender: GameProfile
  ): Promise<string> {
    let description = "";
    const pad = `#${page * 10}`.length;
    for (let col of collectors) {
      const user = await Zephyr.fetchUser(col.discordId);
      const profile = await ProfileService.getProfile(col.discordId);
      description += `\`${(
        `#` + (page * 10 - 10 + collectors.indexOf(col) + 1).toString()
      ).padStart(pad, " ")}\` ${
        profile.private && profile.discordId !== sender.discordId
          ? `*Private User*`
          : user
          ? escapeMarkdown(user.tag)
          : "*Unknown User*"
      } — **${col.amount.toLocaleString()}** cards\n`;
    }
    return description;
  }
}
