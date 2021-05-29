import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import {
  CardService,
  generateCardImage,
} from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ReactionCollector } from "eris-collector";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { MockUserCard } from "../../../structures/game/UserCard";
import { Zephyr } from "../../../structures/client/Zephyr";
import { QuestGetter } from "../../../lib/database/sql/game/quest/QuestGetter";
import { QuestObjective } from "../../../structures/game/quest/QuestObjective";
import { QuestSetter } from "../../../lib/database/sql/game/quest/QuestSetter";
import { QuestProgression } from "../../../structures/game/quest/QuestProgression";

export default class DyeCard extends BaseCommand {
  id = `junkhead`;
  names = [`dye`];
  description = `Dyes a card.`;
  usage = [`$CMD$ <$dye> <card>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
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

    const baseCard = Zephyr.getCard(targetCard.baseCardId)!;

    const mockCard = new MockUserCard({
      id: targetCard.id,
      baseCard: baseCard,
      serialNumber: targetCard.serialNumber,
      frame: targetCard.frame,
      dye: { r: targetDye.dyeR, g: targetDye.dyeG, b: targetDye.dyeB },
    });

    const userTags = await ProfileService.getTags(profile);
    const embed = new MessageEmbed(`Dye Card`, msg.author)
      .setDescription(
        `Really dye this card with \`$${targetDye.id.toString(36)}\` **${
          targetDye.name
        }**?\n` + (await getDescriptions([targetCard], userTags))
      )
      .setFooter(
        `$${targetDye.id.toString(36)} has ${targetDye.charges} charge${
          targetDye.charges === 1 ? `` : `s`
        }.`
      );

    const preview = await generateCardImage(
      mockCard,
      false,
      `./cache/tmp/${mockCard.id}`
    );

    const confirmation = await this.send(msg.channel, embed, {
      files: [{ file: preview, name: "dyepreview.png" }],
    });

    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id &&
      emoji.id === Zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(Zephyr, confirmation, filter, {
      time: 15000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      await this.handleError(msg, msg.author, e);
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
        files: [{ file: dyedCardImage, name: "dyesuccess.png" }],
      });

      const progressableQuests = await QuestGetter.checkAvailableQuestsForProgress(
        profile,
        QuestObjective.DYE
      );

      if (progressableQuests.length > 0) {
        const progressions = progressableQuests.map((q) => {
          return { ...q, increment: 1 } as QuestProgression;
        });

        await QuestSetter.progressQuests(progressions, profile);
      }

      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This dye confirmation has expired.`),
        });
      }
    });

    await this.react(
      confirmation,
      `check:${Zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
