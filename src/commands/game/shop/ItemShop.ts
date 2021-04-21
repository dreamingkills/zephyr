import { Message, PartialEmoji } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ReactionCollector } from "eris-collector";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { isDeveloper } from "../../../lib/ZephyrUtils";
import { ShopError } from "../../../structures/error/ShopError";
import { Shop } from "../../../lib/shop/Shop";
import { GameShop } from "../../../structures/shop/Shop";
import { Logger } from "../../../lib/logger/Logger";

export default class ItemShop extends BaseCommand {
  id = `delusion`;
  names = [`itemshop`, `is`];
  description = `Displays the item shop.`;
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
        await Shop.init();

        const embed = new MessageEmbed(`Item Shop`, msg.author).setDescription(
          `:white_check_mark: Successfully re-initialized the item shop.`
        );

        await this.send(msg.channel, embed);
        return;
      } else if (subcommand === `buy`) {
        const targetItemName = options.slice(1).join(` `).toLowerCase();

        if (!targetItemName) throw new ShopError.InvalidItemNameError(prefix);

        const targetItem = Shop.getShopItemByName(targetItemName);

        if (!targetItem) throw new ShopError.ItemNotFoundError();

        const currency = targetItem.currency;
        const price = targetItem.price;

        const confirmationEmbed = new MessageEmbed(
          `Item Shop`,
          msg.author
        ).setDescription(
          `:warning: __**Please confirm the following purchase:**__\n1x **${targetItem.item.names[0]}** for **${targetItem.price}** ${targetItem.currency}`
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
            Logger.error(`Error in Item Shop reaction collector:\n${error}`);

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
            throw new ShopError.NotEnoughBitsForItemError(targetItem);

          await ProfileService.removeBitsFromProfile(_profile, price);
        } else if (currency === `cubits`) {
          if (price > _profile.cubits)
            throw new ShopError.NotEnoughCubitsForItemError(targetItem);

          await ProfileService.removeCubits(_profile, price);
        } else throw new ShopError.InvalidCurrencyError();

        await ProfileService.addItems(_profile, [
          { item: targetItem.item, count: 1 },
        ]);

        const embed = new MessageEmbed(`Item Shop`, msg.author).setDescription(
          `:white_check_mark: __**Purchase Successful!**__\nYou purchased a **${targetItem.item.names[0]}** for **${targetItem.price}** ${targetItem.currency}.`
        );

        await this.send(msg.channel, embed);

        return;
      }
    }

    const shopItems = Shop.getShop().sort((a, b) =>
      a.item.names[0] > b.item.names[0] ? 1 : -1
    );

    if (shopItems.length === 0) {
      const embed = new MessageEmbed(`Item Shop`, msg.author).setDescription(
        `__**There are currently no items for sale!**__\nTry again later, there may be items available in the future.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const featuredPack = shopItems.find((s) => s.featured);
    let featuredString;

    if (featuredPack) {
      featuredString = `🤩 __**Featured Item**__\n${
        this.zephyr.config.discord.emoji.blank
      } ${
        featuredPack.item.names[0]
      } - **${featuredPack.price.toLocaleString()}** ${
        featuredPack.currency
      }\n${this.zephyr.config.discord.emoji.blank} ${
        featuredPack.item.description
          ? `*"${featuredPack.item.description}"*`
          : ``
      }`;
    }

    let page = 1;

    const embed = new MessageEmbed(`Item Shop`, msg.author).setDescription(
      `${
        featuredString || ``
      }\n\nUse \`${prefix}is buy <item>\` to purchase something!\n${this.renderShopCodeblock(
        shopItems,
        page
      )}`
    );

    await this.send(msg.channel, embed);
    return;
  }

  private renderShopCodeblock(items: GameShop[], page: number): string {
    const pageItems = items.slice(page * 10 - 10, page * 10);

    let longestNameLength = 0;
    const itemStrings: string[] = [];

    for (let item of pageItems) {
      const packString = this.renderShopItem(item);

      const leftSide = packString.split(` - `).slice(0, -1).join(` - `);

      if (leftSide.length > longestNameLength)
        longestNameLength = leftSide.length;

      itemStrings.push(packString);
    }

    const formattedStrings = itemStrings.map(
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

  private renderShopItem(item: GameShop): string {
    return `${item.item.names[0]} - ${item.price.toLocaleString()} ${
      item.currency
    }`;
  }
}
