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
import { ReactionCollector, MessageCollector } from "eris-collector";
import { BaseItem } from "../../../structures/game/Item";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";

export default class UseItem extends BaseCommand {
  names = ["use"];
  description =
    "Use an item.\n**Note**: You must enter the item name **exactly** as it appears!";
  usage = ["$CMD$ <item>", "$CMD$ <frame> <card>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.UnspecifiedItemError();

    const target = options.join(" ")?.toLowerCase();
    const targetItem = items.filter((i) =>
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
        const cardIdentifier = options.slice(
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

        const confirmation = await this.send(msg.channel, embed, {
          file: { file: preview, name: "preview.png" },
        });

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
        collector.on("error", async (e: Error) => {
          await this.handleError(msg, e);
        });

        collector.on("collect", async () => {
          const refetchCard = await card.fetch();
          if (refetchCard.discordId !== msg.author.id)
            throw new ZephyrError.NotOwnerOfCardError(refetchCard);

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
          await this.send(msg.channel, embed, {
            file: { file: newCard, name: "success.png" },
          });

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

        await this.react(
          confirmation,
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
        await this.send(msg.channel, embed);
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

          await this.send(msg.channel, embed, {
            file: { file: buf, name: "dye.png" },
          });
          return;
        } else if (targetItem.id === 22) {
          const dyeIdentifier = options[1];
          if (!dyeIdentifier || !dyeIdentifier.startsWith("$"))
            throw new ZephyrError.InvalidDyeIdentifierError();

          const targetDye = await ProfileService.getDyeByIdentifier(
            dyeIdentifier
          );
          if (targetDye.discordId !== msg.author.id)
            throw new ZephyrError.NotOwnerOfDyeError(targetDye.id);

          await ProfileService.addChargesToDye(targetDye, 1);
          await ProfileService.removeItems(profile, [
            { item: targetItem, count: 1 },
          ]);

          const embed = new MessageEmbed(
            `Recharge Dye`,
            msg.author
          ).setDescription(
            `You added 1 charge to \`$${targetDye.id.toString(36)}\`.`
          );
          await this.send(msg.channel, embed);

          return;
        } else if (targetItem.id === 38) {
          const albums = await AlbumService.getAlbumsByProfile(profile);

          const defaultAlbums = albums.filter((a) =>
            a.name.toLowerCase().includes(`album`)
          );

          let unique =
            defaultAlbums.length === 0 ? 0 : defaultAlbums.length + 1;

          while (
            !albums.filter((a) => a.name.toLowerCase() === `albums (${unique})`)
          ) {
            unique++;
          }

          const newAlbum = await AlbumService.createAlbum(
            `album${unique === 0 ? `` : `(${unique})`}`,
            profile
          );

          await ProfileService.removeItems(profile, [
            { item: targetItem, count: 1 },
          ]);

          const embed = new MessageEmbed(
            `Sealed Book`,
            msg.author
          ).setDescription(
            `You unsealed the book and received an \`${newAlbum.name}\`.`
          );

          await this.send(msg.channel, embed);
          return;
        }
        break;
      }
      case "STICKER": {
        const targetSticker = this.zephyr.getStickerByItemId(targetItem.id);
        if (!targetSticker)
          throw new ZephyrError.NoStickerBoundToItemError(targetItem);

        const identifier = options.slice(targetItem.name.split(" ").length)[0];
        if (!identifier) throw new ZephyrError.InvalidCardReferenceError();

        const card = await CardService.getUserCardByIdentifier(identifier);

        if (card.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(card);

        if (card.wear !== 5)
          throw new ZephyrError.CardConditionTooLowError(card.wear, 5);

        const cardStickers = await CardService.getCardStickers(card);
        if (cardStickers.length >= 3)
          throw new ZephyrError.TooManyStickersError(card);

        const preview = await CardService.generateStickerPreview(
          card,
          this.zephyr
        );

        const embed = new MessageEmbed()
          .setAuthor(
            `Add Sticker | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `Please enter the position (number) you'd like to place your sticker on.`
          )
          .setImage(`attachment://sticker-preview-${card.id}.png`)
          .setFooter(`Enter a number 1-20.`);

        await this.send(msg.channel, embed, {
          file: {
            file: preview,
            name: `sticker-preview-${card.id}.png`,
          },
        });

        const filter = (m: Message) =>
          parseInt(m.content) >= 1 &&
          parseInt(m.content) <= 20 &&
          m.author.id === msg.author.id;
        const collector = new MessageCollector(
          this.zephyr,
          msg.channel,
          filter,
          { time: 30000, max: 1 }
        );
        collector.on("error", async (e: Error) => {
          await this.handleError(msg, e);
        });

        collector.on("collect", async (m: Message) => {
          try {
            const position = parseInt(m.content);
            if (cardStickers.filter((s) => s.position === position)[0])
              throw new ZephyrError.StickerSlotTakenError(card, position);

            await ProfileService.removeItems(profile, [
              { item: targetItem, count: 1 },
            ]);

            const addedSticker = await CardService.addStickerToCard(
              card,
              targetSticker,
              position
            );
            const newCard = await CardService.updateCardCache(
              addedSticker,
              this.zephyr
            );

            const embed = new MessageEmbed()
              .setAuthor(
                `Add Sticker | ${msg.author.tag}`,
                msg.author.dynamicAvatarURL("png")
              )
              .setDescription(
                `You placed a **${targetItem.name}** at position **${position}**.`
              )
              .setImage(`attachment://sticker-added-${card.id}.png`);

            await this.send(msg.channel, embed, {
              file: { file: newCard, name: `sticker-added-${card.id}.png` },
            });
            return;
          } catch (e) {
            this.handleError(msg, e);
            return;
          }
        });
        break;
      }
    }
  }
}
