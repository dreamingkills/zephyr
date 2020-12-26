import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import items from "../../../assets/items.json";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { ShopService } from "../../../lib/database/services/game/ShopService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import chromajs from "chroma-js";
import { createCanvas } from "canvas";
import { ReactionCollector } from "eris-collector";
import { BaseItem } from "../../../structures/game/Item";

export default class UseItem extends BaseCommand {
  names = ["use"];
  description =
    "Use an item.\n**Note**: You must enter the item name **exactly** as it appears!";
  usage = ["$CMD$ <item>", "$CMD$ <frame> <card>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (!this.options[0]) throw new ZephyrError.UnspecifiedItemError();

    const target = this.options.join(" ")?.toLowerCase();
    const targetItem = items.items.filter((i) =>
      target.includes(i.name.toLowerCase())
    )[0] as BaseItem | undefined;

    if (!targetItem) throw new ZephyrError.InvalidItemError();

    const targetUserItem = await ProfileService.getItem(
      profile,
      targetItem.id,
      targetItem.name
    );
    if (targetUserItem.quantity < 1)
      throw new ZephyrError.NoItemInInventoryError(targetItem.name);

    switch (targetItem.type) {
      case "FRAME": {
        const cardIdentifier = this.options.slice(
          targetItem.name.split(" ").length
        )[0];
        if (!cardIdentifier) throw new ZephyrError.InvalidCardReferenceError();

        if (isNaN(parseInt(cardIdentifier, 36)))
          throw new ZephyrError.InvalidCardReferenceError();

        const card = await CardService.getUserCardByIdentifier(cardIdentifier);
        if (card.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(card);

        const frame = await ShopService.getFrameByName(targetItem.name);

        card.dyeMaskUrl = frame.dyeMaskUrl;
        card.frameUrl = frame.frameUrl;

        const preview = await CardService.generateCardImage(card, this.zephyr);

        const embed = new MessageEmbed()
          .setAuthor(
            `Apply Frame | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `Really apply **${targetItem.name}** to \`${card.id.toString(
              36
            )}\`?`
          )
          .setImage(`attachment://preview.png`);

        const confirmation = await msg.channel.createMessage(
          { embed },
          { file: preview, name: "preview.png" }
        );

        const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
          userId === msg.author.id &&
          emoji.id === this.zephyr.config.discord.emojiId.check;

        const collector = new ReactionCollector(
          this.zephyr,
          confirmation,
          filter,
          {
            time: 30000,
            max: 1,
          }
        );

        collector.on("collect", async () => {
          const refetchCard = await card.fetch();
          if (refetchCard.discordId !== msg.author.id) {
            await confirmation.edit({
              embed: embed.setFooter(
                `⚠️ ${refetchCard.id.toString(36)} does not belong to you.`
              ),
            });
            return;
          }

          await confirmation.delete();

          const newCard = await CardService.changeCardFrame(
            card,
            frame.id,
            this.zephyr
          );

          await ProfileService.removeItems(profile, [
            { item: targetItem, count: 1 },
          ]);

          embed.setDescription(
            `You applied **${targetItem.name}** to \`${card.id.toString(36)}\`.`
          );
          embed.setImage(`attachment://success.png`);
          await msg.channel.createMessage(
            { embed },
            { file: newCard, name: "success.png" }
          );

          collector.stop();
          return;
        });

        collector.on("end", async (_collected: unknown, reason: string) => {
          if (reason === "time") {
            await confirmation.edit({
              embed: embed.setFooter(`🕒 This confirmation has expired.`),
            });
          }

          try {
            await confirmation.removeReactions();
          } catch {}
        });

        await confirmation.addReaction(
          `check:${this.zephyr.config.discord.emojiId.check}`
        );
        break;
      }
      case "COUPON": {
        const match = targetItem.name.match(/\d+/g);
        if (!match) throw new ZephyrError.InvalidAmountError("bits");
        let amount = parseInt(match.join(""), 10);

        if (isNaN(amount)) throw new ZephyrError.InvalidAmountError("bits");

        await ProfileService.removeItems(profile, [
          { item: targetItem, count: 1 },
        ]);
        const newProfile = await ProfileService.addBitsToProfile(
          profile,
          amount
        );
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
        break;
      }
      case "CONSUMABLE": {
        if (targetItem.id === 20) {
          await ProfileService.removeItems(profile, [
            { item: targetItem, count: 1 },
          ]);
          const randomColor = chromajs.random();
          const rgb = randomColor.rgb();
          const hex = randomColor.hex();

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
              `You got ` + `\`$${newDye.id.toString(36)}\` **${newDye.name}**!`
            )
            .setThumbnail(`attachment://dye.png`)
            .setColor(hex);

          await msg.channel.createMessage(
            { embed },
            { file: buf, name: "dye.png" }
          );
          break;
        }
      }
    }
  }
}
