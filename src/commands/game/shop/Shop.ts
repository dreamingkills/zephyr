import { EmbedField, Message, PartialEmoji } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { shop } from "../../../assets/cubitshop.json";
import { items } from "../../../assets/items.json";
import { ReactionCollector } from "eris-collector";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

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
      ]);

      const facade = await msg.channel.createMessage({ embed });

      const filter = (_msg: Message, _emoji: PartialEmoji, userID: string) =>
        userID === msg.author.id;
      const collector = new ReactionCollector(this.zephyr, facade, filter, {
        time: 30000,
        max: 1,
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

        try {
          await facade.removeReactions();
        } catch {}
      });

      await facade.addReaction(`1️⃣`);
      return;
    }

    if (subcommand === "buy") {
      const itemQuery = options.slice(1).join(" ");
      const targetItem = items.find((i) => i.name.toLowerCase() === itemQuery);

      if (!targetItem) throw new ZephyrError.InvalidItemError();

      const cubitShopProduct = shop.find((p) => p.itemId === targetItem.id);

      if (cubitShopProduct) {
        const cubitPrice = cubitShopProduct.price;
        if (profile.cubits < cubitPrice)
          throw new ZephyrError.NotEnoughCubitsError(
            profile.cubits,
            cubitPrice
          );

        const embed = new MessageEmbed(
          `Confirm Purchase`,
          msg.author
        ).setDescription(
          `Really purchase **1x** \`${targetItem.name}\` for \`${cubitPrice}\` cubits?`
        );
        const confirmation = await msg.channel.createMessage({ embed });

        const filter = (_msg: Message, emoji: PartialEmoji, userID: string) =>
          userID === msg.author.id && emoji.name === "☑️";
        const collector = new ReactionCollector(
          this.zephyr,
          confirmation,
          filter,
          { time: 30000, max: 1 }
        );

        collector.on("collect", async () => {
          await ProfileService.removeCubits(profile, cubitPrice);
          await ProfileService.addItems(profile, [
            { item: targetItem, count: 1 },
          ]);

          const embed = new MessageEmbed(
            `Purchase Successful`,
            msg.author
          ).setDescription(
            `You purchased **1x** \`${targetItem.name}\` for \`${cubitPrice}\` cubits.`
          );

          await msg.channel.createMessage({ embed });
          return;
        });

        collector.on("end", async (_collected: any, reason: string) => {
          if (reason === "time") {
            await confirmation.edit({
              embed: embed.setFooter(`🕒 This confirmation has expired.`),
            });
          }

          try {
            await confirmation.removeReactions();
          } catch {}
        });

        await confirmation.addReaction("☑️");
        return;
      }
    }
  }

  private renderShop(type: `cubits`): EmbedField[] {
    const emojis: { [key: string]: string } = { STICKER: "📑" };

    switch (type) {
      case `cubits`: {
        let products = [];
        for (let item of shop) {
          const baseItem = items.find((i) => i.id === item.itemId);

          if (!baseItem) continue;
          products.push({
            name: `${emojis[baseItem.type]} ${baseItem.name}`,
            value: `:package: \`${item.price.toLocaleString()}\` cubits`,
          });
        }
        return products;
      }
    }
  }
}
