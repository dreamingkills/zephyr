import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { items } from "../../../assets/items";
import { PrefabItem } from "../../../structures/item/PrefabItem";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";

export default class UseItem extends BaseCommand {
  names = ["use"];
  description = "Uses an item from your items inventory.";
  usage = ["$CMD$ <item>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    // If the user did not specify an item, just ignore it.
    if (!options[0]) throw new ZephyrError.UnspecifiedItemError();

    // Item names may contain spaces, so join everything after `.use`.
    const query = options.join(" ")?.toLowerCase();
    let itemName: string;

    // If our query matches any item names or aliases, that's our item.
    const targetItem = items.filter((i) => {
      const find = i.names.find((n) => query.includes(n.toLowerCase()));
      if (find) {
        itemName = find;
        return find;
      }
    })[0] as PrefabItem | undefined;

    if (!targetItem) throw new ZephyrError.InvalidItemError();

    // Get the quantity of the item the user has.
    const targetUserItem = await ProfileService.getItem(
      profile,
      targetItem.id,
      targetItem.names[0]
    );

    if ((targetUserItem.quantity || 0) <= 0)
      throw new ZephyrError.NoItemInInventoryError(targetItem.names[0]);

    // If the item has no code attached to it, display generic message.
    if (!targetItem.use) {
      const embed = new MessageEmbed(`Use Item`, msg.author).setDescription(
        `Nothing interesting happens.`
      );
      await this.send(msg.channel, embed);
      return;
    }

    const parameters = options.slice(itemName!.split(" ").length);

    if (parameters.length < (targetItem.requiredArguments || 0)) {
      const prefix = this.zephyr.getPrefix(msg.guildID);
      throw new ZephyrError.InvalidItemArgumentsError(targetItem, prefix);
    }

    const embed = new MessageEmbed(`Use Item`, msg.author)
      .setDescription(
        `Really use ${
          targetItem.useCost ? `**${targetItem.useCost}x** ` : ``
        }\`${targetItem.names[0]}\`?`
      )
      .setFooter(`This action is irreversible.`);

    const confirmationMessage = await this.send(msg.channel, embed);

    const confirmed = await new Promise(async (res, _req) => {
      const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
        userId === msg.author.id && emoji.name === "☑";
      const collector = new ReactionCollector(
        this.zephyr,
        confirmationMessage,
        filter,
        { time: 15000, max: 1 }
      );

      collector.on("error", (e: Error) => {
        res(false);
        return this.handleError(msg, e);
      });

      collector.on("collect", () => {
        res(true);
      });

      collector.on("end", async (_collected: any, reason: string) => {
        if (reason === "time") res(false);
      });

      await this.react(confirmationMessage, "☑");
    });

    await confirmationMessage.removeReactions();

    if (!confirmed) {
      await this.edit(
        confirmationMessage,
        embed.setFooter(`🕒 This confirmation has timed out.`)
      );
      return;
    }

    await confirmationMessage.delete();

    await targetItem.use(msg, profile, parameters, this.zephyr);
    return;
  }
}
