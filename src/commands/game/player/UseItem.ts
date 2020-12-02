import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import items from "../../../assets/items.json";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { ShopService } from "../../../lib/database/services/game/ShopService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class UseItem extends BaseCommand {
  names = ["use"];
  description = "Use an item.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const target = this.options.join(" ")?.toLowerCase();
    const targetItem = items.items.filter((i) =>
      target.includes(i.name.toLowerCase())
    )[0];

    if (!targetItem) throw new ZephyrError.InvalidItemError();

    const userItem = await ProfileService.getItem(
      profile,
      targetItem.id,
      targetItem.name
    );

    if (targetItem.type === "FRAME") {
      const offset = this.options.slice(targetItem.name?.split(" ").length);
      const reference = {
        identifier: offset[0]?.split("#")[0],
        serialNumber: parseInt(offset[0]?.split("#")[1], 10),
      };

      if (!reference.identifier || isNaN(reference.serialNumber))
        throw new ZephyrError.InvalidCardReferenceError();
      const card = await CardService.getUserCardByReference(reference);
      if (card.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(card);

      const frame = await ShopService.getFrameByName(targetItem.name);
      await CardService.changeCardFrame(card, frame.id);
      await ProfileService.removeItem(profile, targetItem.id);
      const embed = new MessageEmbed()
        .setAuthor(
          `Use Item | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `${this.zephyr.config.discord.emoji.check} You used \`${
            targetItem.name
          }\` on **${CardService.parseReference(card)}**.` +
            `\n— You now have **${userItem.count - 1}x** \`${
              targetItem.name
            }\`.`
        );
      await msg.channel.createMessage({ embed });
      return;
    } else if (targetItem.type === "COUPON") {
      const match = targetItem.name.match(/\d+/g);
      if (!match) throw new ZephyrError.InvalidAmountError("bits");
      let amount = parseInt(match.join(""), 10);

      if (isNaN(amount)) throw new ZephyrError.InvalidAmountError("bits");

      await ProfileService.removeItem(profile, targetItem.id);
      const newProfile = await ProfileService.addBitsToProfile(profile, amount);
      const embed = new MessageEmbed()
        .setAuthor(
          `Use Item | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `${this.zephyr.config.discord.emoji.check} You used \`${
            targetItem.name
          }\` and received ${
            this.zephyr.config.discord.emoji.bits
          }**${amount.toLocaleString()}**` +
            `\n— You now have **${newProfile.bits.toLocaleString()}** bits.`
        );
      await msg.channel.createMessage({ embed });
      return;
    }
  }
}
