import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ReactionCollector } from "eris-collector";

export default class DyeCard extends BaseCommand {
  names = ["dye"];
  description = "Dyes a card.";
  usage = ["$CMD$ <$dye> <card>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (!this.options[0]?.startsWith("$"))
      throw new ZephyrError.InvalidDyeIdentifierError();
    const targetDye = await ProfileService.getDyeByIdentifier(this.options[0]);

    if (targetDye.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfDyeError(targetDye.id);
    if (targetDye.charges < 1)
      throw new ZephyrError.UnchargedDyeError(targetDye.id);

    if (!this.options[1]) throw new ZephyrError.InvalidCardReferenceError();

    const targetCard = await CardService.getUserCardByIdentifier(
      this.options[1]
    );

    if (targetCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(targetCard);
    if (targetCard.wear !== 5)
      throw new ZephyrError.CardConditionTooLowError(targetCard.wear, 5);

    [targetCard.dyeR, targetCard.dyeG, targetCard.dyeB] = [
      targetDye.dyeR,
      targetDye.dyeG,
      targetDye.dyeB,
    ];

    const userTags = await ProfileService.getTags(profile);
    const embed = new MessageEmbed()
      .setAuthor(
        `Dye Card | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Really dye this card with \`$${targetDye.id.toString(36)}\` **${
          targetDye.name
        }**?\n` +
          CardService.getCardDescriptions([targetCard], this.zephyr, userTags)
      )
      .setFooter(
        `$${targetDye.id.toString(36)} has ${targetDye.charges} charge${
          targetDye.charges === 1 ? `` : `s`
        }.`
      );

    const preview = await CardService.generateCardImage(
      targetCard,
      this.zephyr
    );

    const conf = await msg.channel.createMessage(
      { embed },
      { file: preview, name: "dyepreview.png" }
    );

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 15000,
      max: 1,
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner of the card, or they can do some nasty stuff
      const refetchCard = await CardService.getUserCardById(targetCard.id);
      if (refetchCard.discordId !== msg.author.id) {
        await conf.edit({
          embed: embed.setFooter(
            `⚠️ ${refetchCard.id.toString(36)} does not belong to you.`
          ),
        });
        return;
      }

      // Also check that their dye still has 1 charge
      const refetchDye = await ProfileService.getDyeById(targetDye.id);
      if (refetchDye.charges < 1) {
        await conf.edit({
          embed: embed.setFooter(
            `⚠️ $${targetDye.id.toString(36)} has no charges.`
          ),
        });
        return;
      }

      await conf.delete();

      const dyedCard = await CardService.setCardDye(targetCard, targetDye);
      await ProfileService.removeChargesFromDye(targetDye);

      const dyedCardImage = await CardService.updateCardCache(
        dyedCard,
        this.zephyr
      );

      const successEmbed = new MessageEmbed()
        .setAuthor(
          `Dye Card | ${msg.author.tag}`,
          msg.author.dynamicAvatarURL("png")
        )
        .setDescription(
          `Successfully dyed \`${dyedCard.id.toString(
            36
          )}\` with \`$${targetDye.id.toString(36)}\` **${targetDye.name}**.`
        )
        .setFooter(
          `$${targetDye.id.toString(36)} has ${targetDye.charges - 1} charge${
            targetDye.charges - 1 === 1 ? `` : `s`
          } remaining.`
        );

      await msg.channel.createMessage(
        { embed: successEmbed },
        { file: dyedCardImage, name: "dyesuccess.png" }
      );
      return;
    });
    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit({
          embed: embed.setFooter(`🕒 This dye confirmation has expired.`),
        });
      }
      try {
        await conf.removeReactions();
      } catch {}
    });

    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);
  }
}
