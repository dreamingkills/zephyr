import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { Filter } from "../../../lib/database/sql/Filters";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { GameUserCard } from "../../../structures/game/UserCard";

import { getDescriptions } from "../../../lib/ZephyrUtils";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { GameTag } from "../../../structures/game/Tag";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ScrollingEmbed } from "../../../structures/display/ScrollingEmbed";

export default class CardInventory extends BaseCommand {
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
      .setTitle(`${targetUser.tag}'s cards`);

    const scrollingEmbed = new ScrollingEmbed(this.zephyr, msg, embed, {
      totalPages,
      totalItems: size,
      startingPage: page,
      initialItems: this.renderInventory(inventory, userTags),
      itemName: "card",
    });

    scrollingEmbed.onPageChange(async (page) => {
      filters["page"] = page;

      const newCards = await CardService.getUserInventory(
        target!,
        userTags,
        filters
      );

      return this.renderInventory(newCards, userTags);
    });

    await scrollingEmbed.send();
  }

  private renderInventory(cards: GameUserCard[], tags: GameTag[]): string {
    if (cards.length === 0) return "No cards here!";

    const cardDescriptions = getDescriptions(cards, this.zephyr, tags);
    return cardDescriptions.join("\n");
  }
}
