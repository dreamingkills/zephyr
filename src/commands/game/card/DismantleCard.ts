import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { idToIdentifier } from "../../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";

export default class DismantleCard extends BaseCommand {
  names = ["dismantle", "d"];
  description = "Dismantles a card, giving you dust and bits in exchange.";
  usage = ["$CMD$ [card]"];
  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const rawIdentifier = this.options[0];
    let card: GameUserCard;
    if (!rawIdentifier) {
      card = await CardService.getLastCard(msg.author.id);
    } else card = await CardService.getUserCardByIdentifier(rawIdentifier);

    if (card.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(card);

    const trueIdentifier = idToIdentifier(card.id);

    const bitReward =
      Math.round(15 * card.luckCoefficient) * ((card.wear || 1) * 1.25);

    let description =
      `Really dismantle \`${trueIdentifier}\`? You will receive:` +
      `\n\n:white_medium_small_square: ${this.zephyr.config.discord.emoji.bits} **${bitReward}**` +
      (card.wear > 0
        ? `\n:white_medium_small_square: **1** Dust \`${"★"
            .repeat(card.wear)
            .padEnd(5, "☆")}\``
        : ``);

    const embed = new MessageEmbed()
      .setAuthor(
        `Dismantle | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(description);

    const conf = await msg.channel.createMessage({ embed });
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 15000,
      max: 1,
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can dupe bits
      const refetchCard = await CardService.getUserCardById(card.id);
      if (refetchCard.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(refetchCard);

      // Give the card to the bot
      await CardService.dismantleCards([card], this.zephyr);

      if (card.wear !== 0)
        await ProfileService.addDustToProfile(card.wear, profile);
      const newProfile = await ProfileService.addBitsToProfile(
        profile,
        bitReward
      );

      await conf.edit({
        embed: embed.setFooter(
          `🔥 This card has been destroyed.\nYou now have ${newProfile.bits.toLocaleString()} bits.`
        ),
      });
      return;
    });
    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit({
          embed: embed.setFooter(`This card has not been destroyed.`),
        });
      }
      try {
        await conf.removeReactions();
      } catch {}
    });
  }
}
