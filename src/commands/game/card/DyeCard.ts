import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ReactionCollector } from "eris-collector";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { checkPermission } from "../../../lib/ZephyrUtils";

export default class DyeCard extends BaseCommand {
  names = ["dye"];
  description = "Dyes a card.";
  usage = ["$CMD$ <$dye> <card>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!this.zephyr.flags.dyes) throw new ZephyrError.DyeFlagDisabledError();

    if (!options[0]?.startsWith("$"))
      throw new ZephyrError.InvalidDyeIdentifierError();
    const targetDye = await ProfileService.getDyeByIdentifier(options[0]);

    if (targetDye.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfDyeError(targetDye);
    if (targetDye.charges < 1)
      throw new ZephyrError.UnchargedDyeError(targetDye);

    if (!options[1]) throw new ZephyrError.InvalidCardReferenceError();

    const targetCard = await CardService.getUserCardByIdentifier(options[1]);

    if (targetCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(targetCard);

    if (targetCard.wear !== 5)
      throw new ZephyrError.CardConditionTooLowError(targetCard.wear, 5);

    const isInAlbum = await AlbumService.cardIsInAlbum(targetCard);
    if (isInAlbum) throw new ZephyrError.CardInAlbumError(targetCard);

    [targetCard.dyeR, targetCard.dyeG, targetCard.dyeB] = [
      targetDye.dyeR,
      targetDye.dyeG,
      targetDye.dyeB,
    ];

    const userTags = await ProfileService.getTags(profile);
    const embed = new MessageEmbed(`Dye Card`, msg.author)
      .setDescription(
        `Really dye this card with \`$${targetDye.id.toString(36)}\` **${
          targetDye.name
        }**?\n` + getDescriptions([targetCard], this.zephyr, userTags)
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

    const confirmation = await this.send(msg.channel, embed, {
      file: { file: preview, name: "dyepreview.png" },
    });

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, confirmation, filter, {
      time: 15000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner of the card, or they can do some nasty stuff
      const refetchCard = await targetCard.fetch();
      if (refetchCard.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(refetchCard);

      const isInAlbum = await AlbumService.cardIsInAlbum(refetchCard);
      if (isInAlbum) throw new ZephyrError.CardInAlbumError(refetchCard);

      // Also check that their dye still has 1 charge
      const refetchDye = await targetDye.fetch();
      if (refetchDye.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfDyeError(refetchDye);
      if (refetchDye.charges < 1)
        throw new ZephyrError.UnchargedDyeError(refetchDye);

      await this.delete(confirmation);

      const dyedCard = await CardService.setCardDye(targetCard, targetDye);
      await ProfileService.removeChargesFromDye(targetDye);

      const dyedCardImage = await CardService.updateCardCache(
        dyedCard,
        this.zephyr,
        false,
        true
      );

      const successEmbed = new MessageEmbed(`Dye Card`, msg.author)
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

      await this.send(msg.channel, successEmbed, {
        file: { file: dyedCardImage, name: "dyesuccess.png" },
      });
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This dye confirmation has expired.`),
        });
      }

      if (checkPermission(`manageMessages`, msg.channel, this.zephyr))
        await confirmation.removeReactions();
    });

    await this.react(
      confirmation,
      `check:${this.zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
