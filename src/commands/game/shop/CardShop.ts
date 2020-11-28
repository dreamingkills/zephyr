import { Chance } from "chance";
import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class CardShop extends BaseCommand {
  names = ["cardshop", "cs"];
  description = "Shows you what's on sale in the card shop.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const subcommand = this.options[0]?.toLowerCase();
    if (subcommand === "buy") {
      const group = this.options.slice(1).join(" ").toLowerCase();
      const cards = Object.values(this.zephyr.cards).filter((c) => {
        return c.group?.toLowerCase() === group && c.rarity > 0;
      });

      if (cards.length === 0) {
        const embed = new MessageEmbed()
          .setAuthor(
            `Card Shop | ${msg.author.tag}`,
            msg.author.dynamicAvatarURL("png")
          )
          .setDescription(
            `${this.zephyr.config.discord.emoji.warn} Sorry, but I couldn't find any available cards from that group.` +
              `\nPlease make sure you spelled it correctly.`
          );
        await msg.channel.createMessage({ embed });
        return;
      }

      const chance = new Chance();
      const baseCard = chance.pickone(cards);
      const newCard = await CardService.createNewUserCard(
        baseCard,
        profile,
        this.zephyr,
        300
      );

      const embed = new MessageEmbed()
        .setAuthor(
          `Card Shop | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `You spent ${this.zephyr.config.discord.emoji.bits}**300** and got ${
            (baseCard.group ? `**${baseCard.group}** ` : ``) +
            `**${baseCard.name}**` +
            (baseCard.subgroup ? ` - ${baseCard.subgroup}` : ``)
          } #${newCard.serialNumber.toLocaleString()}!`
        );
      await msg.channel.createMessage({ embed });
      return;
    }

    const prefix = this.zephyr.getPrefix(msg.guildID!);
    const embed = new MessageEmbed()
      .setAuthor(
        `Card Shop | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `You have ${
          this.zephyr.config.discord.emoji.bits
        }**${profile.bits.toLocaleString()}**.` +
          `\n— Use \`${prefix}cs buy <group name>\` to buy a random card from any group.` +
          `\n— Each purchase costs you ${this.zephyr.config.discord.emoji.bits}**300** (excluding sales).` /* +
          `\n\n${this.zephyr.config.discord.emoji.clock} **Limited-Time Deals**` +
          `\n**LOONA** — 35% off! *(2d 06h 59s remaining)*` +
          `\n**EXO** — 35% off! *(2d 06h 59s remaining)*`*/
      );

    await msg.channel.createMessage({ embed });
  }
}
