import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { getItemByName } from "../../../assets/Items";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class UseItem extends BaseCommand {
  id = `superheroes`;
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

    // If our query matches any item names or aliases, that's our item.
    const targetItem = getItemByName(query);

    if (!targetItem) throw new ZephyrError.InvalidItemError();

    const itemName = targetItem.names
      .map((n) => n.toLowerCase())
      .find((n) => query.includes(n))!;

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

    const parameters = options.slice(itemName.split(" ").length);

    if (parameters.length < (targetItem.requiredArguments || 0)) {
      const prefix = Zephyr.getPrefix(msg.guildID);
      throw new ZephyrError.InvalidItemArgumentsError(targetItem, prefix);
    }

    if (!targetItem.confirmation) {
      await targetItem.use(msg, profile, parameters);
      return;
    }

    const embed = new MessageEmbed(`Use Item`, msg.author)
      .setDescription(
        `Really use ${
          targetItem.useCost ? `**${targetItem.useCost}x** ` : ``
        }\`${targetItem.names[0]}\`?`
      )
      .setFooter(`This action is irreversible.`);

    const confirmation = await this.send(msg.channel, embed);

    const confirmed = await new Promise(async (res, _req) => {
      const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
        user.id === msg.author.id && emoji.name === "☑";

      const collector = new ReactionCollector(Zephyr, confirmation, filter, {
        time: 15000,
        max: 1,
      });

      collector.on("error", async (e: Error) => {
        res(false);
        return await this.handleError(msg, msg.author, e);
      });

      collector.on("collect", () => {
        res(true);
      });

      collector.on("end", async (_collected: any, reason: string) => {
        if (reason === "time") res(false);
      });

      await this.react(confirmation, "☑");
    });

    if (!confirmed) {
      await this.edit(
        confirmation,
        embed.setFooter(`🕒 This confirmation has timed out.`)
      );
      return;
    }

    await this.delete(confirmation);

    await targetItem.use(msg, profile, parameters);
    return;
  }
}
