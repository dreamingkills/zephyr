import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import items from "../../../assets/items.json";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { ShopService } from "../../../lib/database/services/game/ShopService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import chromajs from "chroma-js";
import { getNearestColor } from "../../../lib/ZephyrUtils";
import { createCanvas } from "canvas";

export default class UseItem extends BaseCommand {
  names = ["use"];
  description =
    "Use an item.\n**Note**: You must enter the item name **exactly** as it appears!";
  usage = ["$CMD$ <item>", "$CMD$ <frame> <card>"];

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
      const identifier = offset[0];
      if (!identifier) throw new ZephyrError.InvalidCardReferenceError();

      const id = parseInt(identifier, 36);
      if (isNaN(id)) throw new ZephyrError.InvalidCardReferenceError();

      const card = await CardService.getUserCardById(id);
      if (card.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(card);

      const frame = await ShopService.getFrameByName(targetItem.name);
      await CardService.changeCardFrame(card, frame.id, this.zephyr);
      await ProfileService.removeItems(profile, [
        { item: targetItem, count: 1 },
      ]);
      const embed = new MessageEmbed()
        .setAuthor(
          `Use Item | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `${this.zephyr.config.discord.emoji.check} You used \`${
            targetItem.name
          }\` on \`${card.id.toString(36)}\`.` +
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

      await ProfileService.removeItems(profile, [
        { item: targetItem, count: 1 },
      ]);
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
    } else if (targetItem.type === "CONSUMABLE") {
      if (targetItem.id === 20) {
        await ProfileService.removeItems(profile, [
          { item: targetItem, count: 1 },
        ]);
        const randomColor = chromajs.random();
        const rgb = randomColor.rgb();
        const hex = randomColor.hex();
        const colorName = getNearestColor(hex);

        const newDye = await ProfileService.addDye(profile, {
          r: rgb[0],
          g: rgb[1],
          b: rgb[2],
        });

        const canvas = createCanvas(100, 100);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, 100, 100);

        const buffer = canvas.toBuffer("image/jpeg");
        const buf = Buffer.alloc(buffer.length, buffer, "base64");

        const embed = new MessageEmbed()
          .setAuthor(
            `Dye Bottle | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `You got...` +
              `\n\`$${newDye.id.toString(36)}\` **${colorName.name}** [**${
                newDye.charges
              }**]!`
          )
          .setThumbnail(`attachment://dye.png`)
          .setColor(hex);

        await msg.channel.createMessage(
          { embed },
          { file: buf, name: "dye.png" }
        );

        return;
      }
    }
  }
}
