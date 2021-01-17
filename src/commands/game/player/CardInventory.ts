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

export default class CardInventory extends BaseCommand {
  names = ["inventory", "inv", "i"];
  description = "Shows cards that belong to you.";
  usage = [
    "$CMD$ [@mention/id] <filters>",
    "Filters:\n— group=LOONA\n— name=JinSoul\n— issue=>5\n— issue=<5\n— issue=5",
  ];
  allowDm = true;

  private renderInventory(cards: GameUserCard[], tags: GameTag[]): string {
    if (cards.length === 0) return "No cards here!";

    const cardDescriptions = getDescriptions(cards, this.zephyr, tags);
    return cardDescriptions.join("\n");
  }

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

    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(targetUser.tag);

    const filtersRaw = options.filter((v) => v.includes("="));
    const filters: Filter = {};
    for (let opt of filtersRaw) {
      const key = opt.split("=")[0];
      const value = opt.split("=")[1];
      filters[key] = value;
    }

    const userTags = await ProfileService.getTags(target);

    const size = await CardService.getUserInventorySize(
      target,
      userTags,
      filters
    );

    if (
      !filters["page"] ||
      isNaN(parseInt(<string>filters["page"], 10)) ||
      filters["page"] < 1
    )
      filters["page"] = 1;
    const totalPages = Math.ceil(size / 10) || 1;
    if (filters["page"] > totalPages) filters["page"] = totalPages;

    let page = parseInt(filters["page"] as string, 10);
    const inventory = await CardService.getUserInventory(
      target,
      userTags,
      filters
    );

    const embed = new MessageEmbed()
      .setAuthor(
        `Inventory | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setTitle(`${targetUser.tag}'s cards`)
      .setDescription(this.renderInventory(inventory, userTags))
      .setFooter(
        `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()} • ${size} cards`
      );
    const sent = await this.send(msg.channel, embed);
    if (totalPages < 2) return;

    const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id;
    const collector = new ReactionCollector(this.zephyr, sent, filter, {
      time: 2 * 60 * 1000,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
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
        embed.setDescription(this.renderInventory(newCards, userTags));
        embed.setFooter(`Page ${page} of ${totalPages} • ${size} entries`);
        await sent.edit({ embed });

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr))
          await sent.removeReaction(emoji.name, userId);
      }
    );

    if (totalPages > 2) await this.react(sent, `⏮`);
    if (totalPages > 1) await this.react(sent, `◀`);
    if (totalPages > 1) await this.react(sent, `▶`);
    if (totalPages > 2) await this.react(sent, `⏭`);
  }
}
