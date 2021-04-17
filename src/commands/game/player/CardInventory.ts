import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { Filter } from "../../../lib/database/sql/Filters";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";
import { ReactionCollector } from "eris-collector";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { GameTag } from "../../../structures/game/Tag";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { editMessage } from "../../../lib/discord/message/editMessage";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { GameAlbumCard } from "../../../structures/game/Album";

export default class CardInventory extends BaseCommand {
  id = `cirice`;
  names = ["inventory", "inv", "i"];
  description = "Shows cards that belong to you.";
  usage = [
    "$CMD$ [@mention/id] <filters>",
    "Filters:\n— group=LOONA\n— name=JinSoul\n— issue=>5\n— issue=<5\n— issue=5",
  ];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let target: GameProfile | undefined = undefined;
    let targetUser;

    const id = options.filter((o) => !isNaN(parseInt(o)) && o.length >= 17)[0];
    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (id) {
      targetUser = await this.zephyr.fetchUser(id);
    } else {
      targetUser = msg.author;
      target = profile;
    }

    if (!targetUser) throw new ZephyrError.UserNotFoundError();

    if (!target) target = await ProfileService.getProfile(targetUser.id);

    if (
      target.private &&
      target.discordId !== msg.author.id &&
      !this.zephyr.config.moderators.includes(msg.author.id) &&
      !this.zephyr.config.developers.includes(msg.author.id)
    )
      throw new ZephyrError.PrivateProfileError(targetUser.tag);

    const filters: Filter = {};
    let targetFilter;

    for (const [index, opt] of options.map((o) => o.toLowerCase()).entries()) {
      const option = opt
        .replace(target.discordId, ``)
        .replace(`<@!`, ``)
        .replace(`<@`, ``)
        .replace(` >`, ``)
        .trim();
      if (option.length < 1) continue;

      if (option.includes(`=`)) {
        targetFilter = option.split(`=`)[0];
        filters[targetFilter] = option.split(`=`)[1];
        continue;
      }

      const previousString = options[index - 1];
      if (previousString && targetFilter) {
        filters[targetFilter] += ` ${option}`;
      }
    }

    const verbose = filters[`verbose`] === `true` || filters[`v`] === `true`;

    const userTags = await ProfileService.getTags(target);
    const cardsInAlbum = await AlbumService.getCardsInAlbums(target);

    const size = await CardService.getUserInventorySize(
      target,
      userTags,
      filters
    );

    const totalPages = Math.ceil(size / 10) || 1;

    filters[`page`] = isNaN(parseInt(<string>filters[`page`], 10))
      ? 1
      : filters[`page`] > totalPages
      ? totalPages
      : filters[`page`];

    let page = parseInt(filters["page"] as string, 10);
    const inventory = await CardService.getUserInventory(
      target,
      userTags,
      filters
    );

    const embed = new MessageEmbed(`Inventory`, msg.author)
      .setTitle(`${targetUser.tag}'s cards`)
      .setDescription(
        await this.renderInventory(inventory, userTags, verbose, cardsInAlbum)
      )
      .setFooter(
        `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${size} cards`
      );
    const sent = await this.send(msg.channel, embed);
    if (totalPages < 2) return;

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id && [`⏮`, `◀`, `▶`, `⏭`].includes(emoji.name);

    const collector = new ReactionCollector(this.zephyr, sent, filter, {
      time: 2 * 60 * 1000,
    });

    collector.on("error", async (e: Error) => {
      console.error(e);
      await this.handleError(msg, msg.author, e);
    });

    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userId: string) => {
        if (emoji.name === "⏮" && page !== 1) page = 1;
        if (emoji.name === "◀" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶" && page !== totalPages) page++;
        if (emoji.name === "⏭" && page !== totalPages) page = totalPages;

        filters["page"] = page;
        const newCards = await CardService.getUserInventory(
          target!,
          userTags,
          filters
        );

        embed.setDescription(
          await this.renderInventory(newCards, userTags, verbose, cardsInAlbum)
        );
        embed.setFooter(`Page ${page} of ${totalPages} • ${size} entries`);
        await editMessage(sent, embed);

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr))
          await sent.removeReaction(emoji.name, userId);
      }
    );

    if (totalPages > 2) await this.react(sent, `⏮`);
    if (totalPages > 1) await this.react(sent, `◀`);
    if (totalPages > 1) await this.react(sent, `▶`);
    if (totalPages > 2) await this.react(sent, `⏭`);
  }

  private async renderInventory(
    cards: GameUserCard[],
    tags: GameTag[],
    showSubgroup: boolean = false,
    cardsInAlbum: GameAlbumCard[]
  ): Promise<string> {
    if (cards.length === 0) return "No cards here!";

    const cardDescriptions = await getDescriptions(
      cards,
      this.zephyr,
      tags,
      showSubgroup,
      cardsInAlbum
    );

    return cardDescriptions.join("\n");
  }
}
