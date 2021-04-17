import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ShopError } from "../../../structures/error/ShopError";
import { getItemById } from "../../../assets/Items";
import { Stickers } from "../../../lib/cosmetics/Stickers";

export default class ViewTags extends BaseCommand {
  id = `mandatory`;
  names = [`stickerpack`, `sp`];
  description = `Shows you information about a sticker pack.`;
  usage = [`$CMD$ <pack name>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const targetPackName = options.join(` `)?.toLowerCase();
    const prefix = this.zephyr.getPrefix(msg.guildID);

    if (!targetPackName) throw new ShopError.InvalidPackNameError(prefix);

    const targetPack = Stickers.getStickerPackByName(targetPackName);

    if (!targetPack) throw new ShopError.PackNotFoundError();

    const targetPackItem = getItemById(targetPack.itemId);

    let packString = `__**${targetPack.name}**__ - ${targetPack.stickers.length} stickers`;

    if (targetPackItem?.description)
      packString += `\n*"${targetPackItem.description}"*`;

    if (targetPack.stickers.length === 0) {
      packString += `\n\n**This pack has no stickers in it!**`;
    } else {
      const sumWeighting = targetPack.stickers.reduce(
        (a, b) => (a += b.rarity),
        0
      );

      const stickerDescriptions = [];
      let longestStickerName = targetPack.stickers.sort(
        (a, b) => b.name.length - a.name.length
      )[0].name.length;

      for (let sticker of targetPack.stickers) {
        if (sticker.name.length > longestStickerName)
          longestStickerName = sticker.name.length;

        stickerDescriptions.push(
          `${sticker.name.padStart(longestStickerName, ` `)} (${(
            (sticker.rarity / sumWeighting) *
            100
          ).toFixed(0)}% chance)`
        );
      }

      packString += `\n\nUse \`${prefix}ps <sticker name>\` to preview a sticker!\n\`\`\`\n${stickerDescriptions.join(
        `\n`
      )}\`\`\``;
    }

    const embed = new MessageEmbed(`Sticker Pack`, msg.author).setDescription(
      packString
    );

    await this.send(msg.channel, embed);
    return;
  }
}
