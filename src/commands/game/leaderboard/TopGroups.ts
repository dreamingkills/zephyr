import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";

export default class TopGroup extends BaseCommand {
  names = ["topgroup", "tg"];
  description = "Shows you the top collectors of a certain group.";
  usage = ["$CMD$ <group name>"];

  private async renderBody(
    collectors: { discordId: string; amount: number }[],
    page: number
  ): Promise<string> {
    let description = "";
    const pad = `#${page * 10}`.length;
    for (let col of collectors) {
      const user = await this.zephyr.fetchUser(col.discordId);
      description += `\`${(
        `#` + (page * 10 - 10 + collectors.indexOf(col) + 1).toString()
      ).padStart(pad, " ")}\` ${
        user.tag
      } — **${col.amount.toLocaleString()}** cards\n`;
    }
    return description;
  }
  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const groupRaw = this.options.join(" ").toLowerCase();
    if (!groupRaw) throw new ZephyrError.UnspecifiedGroupError();

    const match = this.zephyr
      .getCards()
      .filter((c) => c.group && c.group.toLowerCase() === groupRaw)[0];
    if (!match || !match.group) throw new ZephyrError.InvalidGroupError();

    const group = match.group;
    const ids = this.zephyr
      .getCards()
      .filter((c) => c.group === group)
      .map((c) => c.id);

    let page = 1;
    const topCollectorCount = await CardService.getNumberOfTopCollectors(
      ids,
      this.zephyr
    );
    const topCollectors = await CardService.getTopCollectorsByBaseIds(
      ids,
      this.zephyr,
      page
    );

    const totalPages = Math.ceil(topCollectorCount / 10);

    const title = `Top collectors of ${group} `;
    const embed = new MessageEmbed()
      .setAuthor(
        `Top Collectors | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${title} (${1 + 10 * page - 10}-${10 * page})`)
      .setDescription(await this.renderBody(topCollectors, page))
      .setFooter(
        `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${topCollectorCount.toLocaleString()} entries`
      );
    const board = await msg.channel.createMessage({ embed });

    if (totalPages < 2) return;

    if (totalPages > 2) board.addReaction(`⏮️`);
    if (totalPages > 1) board.addReaction(`◀️`);
    // board.addReaction(`🔢`),
    if (totalPages > 1) board.addReaction(`▶️`);
    if (totalPages > 2) board.addReaction(`⏭️`);

    const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id;
    const collector = new ReactionCollector(this.zephyr, board, filter, {
      time: 2 * 60 * 1000,
    });
    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userId: string) => {
        if (emoji.name === "⏮️" && page !== 1) page = 1;
        if (emoji.name === "◀️" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶️" && page !== totalPages) page++;
        if (emoji.name === "⏭️" && page !== totalPages) page = totalPages;

        const newTopCollectors = await CardService.getTopCollectorsByBaseIds(
          ids,
          this.zephyr,
          page
        );
        embed.setTitle(`${title} (${1 + 10 * page - 10}-${10 * page})`);
        embed.setDescription(await this.renderBody(newTopCollectors, page));
        embed.setFooter(
          `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${topCollectorCount.toLocaleString()} entries`
        );
        await board.edit({ embed });

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr))
          await board.removeReaction(emoji.name, userId);
      }
    );
    return;
  }
}
