import { Message, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameBaseCard } from "../../../structures/game/BaseCard";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ChoiceEmbed } from "../../../structures/client/ChoiceEmbed";

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
    let nameQuery: string;
    let baseCard: GameBaseCard | undefined;
    if (!options[0]) {
      const lastCard = await ProfileService.getLastCard(profile);
      const lastBase = this.zephyr.getCard(lastCard.baseCardId);

      baseCard = lastBase;
    } else nameQuery = options.join(" ")?.trim();

    if (baseCard) {
      const embed = await this.getCardStats(baseCard, msg.author);
      await msg.channel.createMessage({ embed });
      return;
    }

    const find = this.zephyr
      .getCards()
      .filter((c) => c.name.toLowerCase() === nameQuery.toLowerCase());

    if (!find[0]) throw new ZephyrError.InvalidLookupQueryError();

    if (find.length === 1) {
      const embed = await this.getCardStats(find[0], msg.author);
      await msg.channel.createMessage({ embed });
      return;
    }

    const embed = new MessageEmbed()
      .setAuthor(
        `Lookup | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `I found multiple matches for **${find[0].name}**.\nPlease reply with a number to confirm which person you're talking about.\n`
      );

    const choiceEmbed = new ChoiceEmbed(
      this.zephyr,
      msg,
      embed,
      find.map(
        (u) =>
          `${u.group ? `**${u.group}** ` : ``}${u.name}${
            u.subgroup ? ` (${u.subgroup})` : ``
          }`
      )
    );

    const choice = await choiceEmbed.ask();

    if (choice) {
      await msg.channel.createMessage({
        embed: await this.getCardStats(find[choice], msg.author),
      });
    }
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

    embed.setDescription(
      `Name — **${card.name}**` +
        (card.group ? `\nGroup — **${card.group}**` : ``) +
        (card.subgroup ? `\nTheme — **${card.subgroup}**` : ``) +
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
        `\nAverage claim time: **${Math.max(avgClaimTime / 1000 - 5, 0).toFixed(
          2
        )}s**\n\n` +
        `**Condition Spread**` +
        `\n— \`☆☆☆☆☆\` **${wearSpread[0].toLocaleString()}**` +
        `\n— \`★☆☆☆☆\` **${wearSpread[1].toLocaleString()}**` +
        `\n— \`★★☆☆☆\` **${wearSpread[2].toLocaleString()}**` +
        `\n— \`★★★☆☆\` **${wearSpread[3].toLocaleString()}**` +
        `\n— \`★★★★☆\` **${wearSpread[4].toLocaleString()}**` +
        `\n— \`★★★★★\` **${wearSpread[5].toLocaleString()}**`
    );

    return embed;
  }
}
