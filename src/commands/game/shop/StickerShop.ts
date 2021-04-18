import { Message, PartialEmoji } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ReactionCollector } from "eris-collector";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { isDeveloper } from "../../../lib/ZephyrUtils";
import { ShopError } from "../../../structures/error/ShopError";
import { GameStickerPack } from "../../../structures/shop/StickerPack";
import { getItemById } from "../../../assets/Items";
import { Stickers } from "../../../lib/cosmetics/Stickers";

export default class Shop extends BaseCommand {
  id = `repentless`;
  names = [`stickershop`, `ss`];
  description = `Displays the sticker shop.`;
  subcommands = [`buy <item>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const subcommand = options[0]?.toLowerCase();
    const prefix = this.zephyr.getPrefix(msg.guildID);

    if (subcommand) {
      if (subcommand === `refresh` && isDeveloper(msg.author, this.zephyr)) {
        await Stickers.loadStickerPacks();

        const embed = new MessageEmbed(
          `Sticker Shop`,
          msg.author
        ).setDescription(
          `:white_check_mark: Successfully refreshed the sticker shop.`
        );

        await this.send(msg.channel, embed);
        return;
      } else if (subcommand === `buy`) {
        const targetPackName = options.slice(1).join(` `).toLowerCase();

        if (!targetPackName) throw new ShopError.InvalidPackNameError(prefix);

        const targetPack = Stickers.getStickerPackByName(targetPackName);

        if (!targetPack) throw new ShopError.PackNotFoundError();

        if (!targetPack.shoppable && !isDeveloper(msg.author, this.zephyr)) {
          const prefix = this.zephyr.getPrefix(msg.guildID);

          throw new ShopError.PackNotForSaleError(prefix);
        }

        const packItem = getItemById(targetPack.itemId);

        if (!packItem) throw new ShopError.ItemNotBoundError();

        const currency = targetPack.currency;
        const price = targetPack.price;

        const confirmationEmbed = new MessageEmbed(
          `Sticker Shop`,
          msg.author
        ).setDescription(
          `:warning: __**Please confirm the following purchase:**__\n1x **${targetPack.name}** for **${targetPack.price}** ${targetPack.currency}`
        );
        const confirmationMessage = await this.send(
          msg.channel,
          confirmationEmbed
        );

        await this.react(confirmationMessage, `☑`);

        const confirmed = await new Promise((res) => {
          const filter = (_m: Message, emoji: PartialEmoji, userID: string) =>
            emoji.name === `☑` && userID === msg.author.id;

          const collector = new ReactionCollector(
            this.zephyr,
            confirmationMessage,
            filter,
            { time: 30000 }
          );

          collector.on(`error`, (error: Error) => {
            console.log(`Error in Sticker Shop reaction collector:\n${error}`);

            res(false);
          });

          collector.on(`collect`, () => {
            collector.stop();
            res(true);
          });

          collector.on(`end`, (reason: string) => {
            if (reason === `time`) res(false);
          });
        });

        if (!confirmed) {
          await this.edit(
            confirmationMessage,
            confirmationEmbed.setDescription(
              `🕒 This confirmation has expired.`
            )
          );

          return;
        }

        await confirmationMessage.delete();

        const _profile = await profile.fetch();
        if (currency === `bits`) {
          if (price > _profile.bits)
            throw new ShopError.NotEnoughBitsForPackError(targetPack);

          await ProfileService.removeBitsFromProfile(_profile, price);
        } else if (currency === `cubits`) {
          if (price > _profile.cubits)
            throw new ShopError.NotEnoughCubitsForPackError(targetPack);

          await ProfileService.removeCubits(_profile, price);
        } else throw new ShopError.InvalidCurrencyError();

        await ProfileService.addItems(_profile, [{ item: packItem, count: 1 }]);

        const embed = new MessageEmbed(
          `Sticker Shop`,
          msg.author
        ).setDescription(
          `:white_check_mark: __**Purchase Successful!**__\nYou purchased a **${targetPack.name}** for **${targetPack.price}** ${targetPack.currency}.`
        );

        await this.send(msg.channel, embed);

        return;
      }
    }

    const stickerPacks = Stickers.getStickerPacks()
      .sort((a, b) => (a.name > b.name ? 1 : -1))
      .filter((p) => p.shoppable && p.stickers.length > 0);

    if (stickerPacks.length === 0) {
      const embed = new MessageEmbed(`Sticker Shop`, msg.author).setDescription(
        `__**There are currently no sticker packs for sale!**__\nTry again later, there may be packs available in the future.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const featuredPack = stickerPacks.find((s) => s.featured);
    let featuredString;

    if (featuredPack) {
      const packItem = getItemById(featuredPack.itemId);

      if (packItem) {
        featuredString = `🤩 __**Featured Sticker Pack**__\n${
          this.zephyr.config.discord.emoji.blank
        } ${featuredPack.name} - **${featuredPack.price.toLocaleString()}** ${
          featuredPack.currency
        } *(20% off!)*\n${this.zephyr.config.discord.emoji.blank} ${
          packItem.description ? `*"${packItem.description}"*` : ``
        }`;
      }
    }

    let page = 1;

    const embed = new MessageEmbed(`Sticker Shop`, msg.author).setDescription(
      `${
        featuredString || ``
      }\n\nUse \`${prefix}ss buy <pack>\` to purchase something!\n${this.renderShopCodeblock(
        stickerPacks,
        page
      )}`
    );

    await this.send(msg.channel, embed);
    return;
  }

  private renderShopCodeblock(packs: GameStickerPack[], page: number): string {
    const pagePacks = packs.slice(page * 10 - 10, page * 10);

    let longestNameLength = 0;
    const packStrings: string[] = [];

    for (let pack of pagePacks) {
      const packString = this.renderPack(pack);

      const leftSide = packString.split(` - `).slice(0, -1).join(` - `);

      if (leftSide.length > longestNameLength)
        longestNameLength = leftSide.length;

      packStrings.push(packString);
    }

    const formattedStrings = packStrings.map(
      (ps) =>
        `${ps
          .split(` - `)
          .slice(0, 1)
          .join(` - `)
          .padStart(longestNameLength, ` `)} - ${ps
          .split(` - `)
          .splice(-1)
          .join(` - `)}`
    );

    return `\`\`\`\n${formattedStrings.join(`\n`)}\n\`\`\``;
  }

  private renderPack(pack: GameStickerPack): string {
    return `${pack.name} (${
      pack.stickers.length
    } stickers) - ${pack.price.toLocaleString()} ${pack.currency}`;
  }
}
