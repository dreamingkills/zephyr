import { EmbedField, Message, PartialEmoji } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import shop from "../../../assets/shop.json";
import { ReactionCollector } from "eris-collector";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ItemService } from "../../../lib/ItemService";

export default class Shop extends BaseCommand {
  names = [`shop`];
  description = `Shows you the available shops.`;
  subcommands = [`buy <item>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const subcommand = options[0];

    if (!subcommand) {
      const embed = new MessageEmbed(`Shop`, msg.author).setDescription(
        `Please choose the shop you'd like to view.`
      );

      embed.addFields([
        {
          name: `${this.zephyr.config.discord.emoji.blank} Bits`,
          value: `${
            this.zephyr.config.discord.emoji.bits
          } \`${profile.bits.toLocaleString()}\`\n\u200b`,
          inline: true,
        },
        {
          name: `${this.zephyr.config.discord.emoji.blank} Cubits`,
          value: `:package: \`${profile.cubits.toLocaleString()}\`\n\u200b`,
          inline: true,
        },
        {
          name: `${this.zephyr.config.discord.emoji.blank} ???`,
          value: `:grey_question: \`0\`\n\u200b`,
          inline: true,
        },
      ]);

      embed.addFields([
        {
          name: `:one: Cubit Shop`,
          value: `Purchase cosmetics for your cards.`,
        },
        {
          name: `:two: Bit Shop`,
          value: `Purchase useful items...`,
        },
      ]);

      const facade = await this.send(msg.channel, embed);

      const filter = (_msg: Message, _emoji: PartialEmoji, userID: string) =>
        userID === msg.author.id;
      const collector = new ReactionCollector(this.zephyr, facade, filter, {
        time: 30000,
        max: 1,
      });
      collector.on("error", async (e: Error) => {
        await this.handleError(msg, e);
      });

      const prefix = this.zephyr.getPrefix(msg.guildID);
      collector.on("collect", async (_m: Message, emoji: PartialEmoji) => {
        embed.fields = embed.fields.slice(0, 3);
        if (emoji.name === `1️⃣`) {
          const rendered = this.renderShop(`cubits`);

          embed.setDescription(`Viewing the **Cubit** shop...`);
          embed.fields = [...embed.fields, ...rendered];
          embed.setFooter(
            `Use ${prefix}shop buy <item> to purchase something!`
          );
        } else if (emoji.name === `2️⃣`) {
          const rendered = this.renderShop(`bits`);

          embed.setDescription(`Viewing the **Bit** shop...`);
          embed.fields = [...embed.fields, ...rendered];
          embed.setFooter(
            `Use ${prefix}shop buy <item> to purchase something!`
          );
        }

        await facade.edit({ embed });
        return;
      });

      collector.on("end", async (_collected: any, reason: string) => {
        if (reason === "time") {
          await facade.edit({
            embed: embed.setFooter(`🕒 This selection has expired.`),
          });
        }

        await facade.removeReactions();
      });

      await this.react(facade, `1️⃣`);
      await this.react(facade, `2️⃣`);
      return;
    }

    if (subcommand === "buy") {
      const itemQuery = options.slice(1).join(" ")?.toLowerCase();
      const targetItem = ItemService.getItemByName(itemQuery);

      if (!targetItem) throw new ZephyrError.InvalidItemError();

      const shopProduct = [...shop.bits, ...shop.cubits].find(
        (p) => p.itemId === targetItem.id
      );

      if (shopProduct) {
        const price = shopProduct.price;
        const currency = shop.bits.includes(shopProduct) ? `bits` : `cubits`;
        if (profile[currency] < price)
          throw new ZephyrError.NotEnoughCurrencyToBuyError(currency, price);

        const embed = new MessageEmbed(
          `Confirm Purchase`,
          msg.author
        ).setDescription(
          `Really purchase **1x** \`${targetItem.names[0]}\` for \`${price}\` ${currency}?`
        );
        const confirmation = await this.send(msg.channel, embed);

        const filter = (_msg: Message, emoji: PartialEmoji, userID: string) =>
          userID === msg.author.id && emoji.name === "☑️";
        const collector = new ReactionCollector(
          this.zephyr,
          confirmation,
          filter,
          { time: 30000, max: 1 }
        );
        collector.on("error", async (e: Error) => {
          await this.handleError(msg, e);
        });

        collector.on("collect", async () => {
          if (currency === `cubits`) {
            await ProfileService.removeCubits(profile, price);
          } else if (currency === `bits`) {
            await ProfileService.removeBitsFromProfile(profile, price);
          }
          await ProfileService.addItems(profile, [
            { item: targetItem, count: 1 },
          ]);

          const embed = new MessageEmbed(
            `Purchase Successful`,
            msg.author
          ).setDescription(
            `You purchased **1x** \`${targetItem.names[0]}\` for \`${price}\` ${currency}.`
          );

          await this.send(msg.channel, embed);
          return;
        });

        collector.on("end", async (_collected: any, reason: string) => {
          if (reason === "time") {
            await confirmation.edit({
              embed: embed.setFooter(`🕒 This confirmation has expired.`),
            });
          }

          await this.delete(confirmation);
        });

        await this.react(confirmation, "☑️");
        return;
      }
    }
  }

  private renderShop(type: `cubits` | `bits`): EmbedField[] {
    switch (type) {
      case `cubits`: {
        let products = [];
        for (let item of shop.cubits) {
          const baseItem = ItemService.getItemById(item.itemId);

          if (!baseItem) continue;
          products.push({
            name: `${baseItem.emoji} ${baseItem.names[0]}`,
            value: `:package: \`${item.price.toLocaleString()}\` cubits`,
          });
        }
        return products;
      }
      case `bits`: {
        let products = [];
        for (let item of shop.bits) {
          const baseItem = ItemService.getItemById(item.itemId);

          if (!baseItem) continue;
          products.push({
            name: `${baseItem.emoji} ${baseItem.names[0]}`,
            value: `${
              this.zephyr.config.discord.emoji.bits
            } \`${item.price.toLocaleString()}\` bits`,
          });
        }
        return products;
      }
    }
  }
}
