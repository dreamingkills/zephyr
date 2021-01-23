import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { items } from "../../../assets/items";
import { PrefabItem } from "../../../structures/item/PrefabItem";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class ItemInfo extends BaseCommand {
  names = ["iteminfo", "ii"];
  description =
    "Shows information about an item. Includes aliases and a short description.";
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidItemError();

    const itemQuery = options
      .filter((i) => i.toLowerCase() !== "--dev")
      .join(" ")
      .toLowerCase();
    const targetItem = items.filter((i) =>
      i.names.map((n) => n.toLowerCase()).includes(itemQuery)
    )[0] as PrefabItem | undefined;

    if (!targetItem) throw new ZephyrError.InvalidItemError();

    const prefix = this.zephyr.getPrefix(msg.guildID);
    const embed = new MessageEmbed(`Item Info`, msg.author).setDescription(
      `**${targetItem.names[0]}**` +
        (targetItem.names.length > 1
          ? `\n*also known as:* \`${targetItem.names
              .slice(1)
              .join(`\`, \``)}\`\n`
          : ``) +
        (targetItem.description ? `\n*${targetItem.description}*` : ``) +
        (targetItem.usage
          ? `\n\n**Usage**: \`${prefix}${targetItem.usage.replace(
              `$BASE$`,
              `use ${targetItem.names[0]}`
            )}\``
          : ``)
    );

    if (options.map((o) => o.toLowerCase()).includes("--dev"))
      embed.setFooter(
        `id ${targetItem.id} / use?: ${!!targetItem.use} / idx ${items.indexOf(
          targetItem
        )}`
      );

    await this.send(msg.channel, embed);

    return;
  }
}
