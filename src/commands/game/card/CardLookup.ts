import { Message, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { MessageCollector } from "eris-collector";
import { GameBaseCard } from "../../../structures/game/BaseCard";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export default class CardLookup extends BaseCommand {
  names = ["lookup", "lu"];
  description = "Shows you information about a card.";
  usage = ["$CMD$ <name>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) {
      const lastCard = await CardService.getLastCard(profile);
      const lastBase = this.zephyr.getCard(lastCard.baseCardId);

      const embed = await this.getCardStats(lastBase, msg.author);
      await this.send(msg.channel, embed);
      return;
    }

    let nameQuery = options
      .join(" ")
      .toLowerCase()
      .trim()
      .replace(/([()])/g, ``);

    if (!nameQuery) throw new ZephyrError.InvalidLookupQueryError();

    const find = this.zephyr.getCards().filter((c) => {
      return `${c.group ? c.group : ``} ${c.name} ${
        c.subgroup ? c.subgroup : ``
      }`
        .trim()
        .toLowerCase()
        .includes(nameQuery);
    });

    if (!find[0]) throw new ZephyrError.NoResultsFoundInLookupError();
    if (find.length > 25) throw new ZephyrError.LookupQueryTooBroadError();

    if (find.length === 1) {
      const embed = await this.getCardStats(find[0], msg.author);
      await this.send(msg.channel, embed, {
        file: { file: find[0].image, name: `card.png` },
      });
      return;
    }

    const embed = new MessageEmbed()
      .setAuthor(
        `Lookup | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `I found multiple matches for **${nameQuery}**.\nPlease reply with a number to confirm which person you're talking about.\n` +
          find
            .map(
              (u, index) =>
                `— \`${index + 1}\` **${u.group || `Soloist`}** ${u.name}${
                  u.subgroup ? ` (${u.subgroup})` : ``
                }`
            )
            .join("\n")
      );

    const conf = await this.send(msg.channel, embed);

    const filter = (m: Message) =>
      find[parseInt(m.content) - 1] && m.author.id === msg.author.id;
    const collector = new MessageCollector(this.zephyr, msg.channel, filter, {
      time: 15000,
      max: 1,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    collector.on("collect", async (m: Message) => {
      const embed = await this.getCardStats(
        find[parseInt(m.content) - 1],
        msg.author
      );

      await this.send(msg.channel, embed, {
        file: { file: find[parseInt(m.content) - 1].image, name: `card.png` },
      });
      return;
    });
    collector.on("end", async (_c: any, reason: string) => {
      if (reason === "time") {
        await conf.edit({
          embed: embed.setFooter(`🕒 This lookup has timed out.`),
        });
      }
    });
  }

  private async getCardStats(
    card: GameBaseCard,
    author: User
  ): Promise<MessageEmbed> {
    card = await this.zephyr.refreshCard(card.id);
    const timesDestroyed = await CardService.getTimesCardDestroyed(
      card,
      this.zephyr
    );
    const timesWishlisted = await CardService.getTimesCardWishlisted(card);
    const avgClaimTime = await CardService.getAverageClaimTime(card);
    const wearSpread = await CardService.getCardWearSpread(card, this.zephyr);

    const embed = new MessageEmbed().setAuthor(
      `Lookup | ${author.tag}`,
      author.dynamicAvatarURL("png")
    );

    embed
      //.setTitle(`Lookup - ${card.group ? `${card.group} ` : ``}${card.name}`)
      .setDescription(
        `Name — **${card.name}**` +
          (card.group ? `\nGroup — **${card.group}**` : ``) +
          (card.subgroup ? `\nTheme — **${card.subgroup}**` : ``) +
          (card.birthday ? `\nBirthday — **${card.birthday}**` : ``) +
          `\n\n**${
            card.name
          }** is on **${timesWishlisted.toLocaleString()}** wishlists.` +
          `\n\nTotal generated: **${card.totalGenerated.toLocaleString()}**` +
          `\nTotal claimed: **${card.serialTotal.toLocaleString()}**` +
          `\nTotal burned: **${timesDestroyed.toLocaleString()}**` +
          `\n\nClaim rate: **${(
            (card.serialTotal / Math.max(card.totalGenerated, 1)) *
            100
          ).toFixed(2)}%**` +
          `\nAverage claim time: **${Math.max(
            avgClaimTime / 1000 - 5,
            0
          ).toFixed(2)}s**\n\n` +
          `**Condition Spread**` +
          `\n— \`☆☆☆☆☆\` **${wearSpread[0].toLocaleString()}**` +
          `\n— \`★☆☆☆☆\` **${wearSpread[1].toLocaleString()}**` +
          `\n— \`★★☆☆☆\` **${wearSpread[2].toLocaleString()}**` +
          `\n— \`★★★☆☆\` **${wearSpread[3].toLocaleString()}**` +
          `\n— \`★★★★☆\` **${wearSpread[4].toLocaleString()}**` +
          `\n— \`★★★★★\` **${wearSpread[5].toLocaleString()}**`
      )
      .setThumbnail(`attachment://card.png`);

    return embed;
  }
}
