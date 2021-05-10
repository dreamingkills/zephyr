import { Message, PartialEmoji, User } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { Zephyr } from "../../structures/client/Zephyr";
import { GameProfile } from "../../structures/game/Profile";
import { PrefabItem } from "../../structures/item/PrefabItem";
import { CardService } from "../database/services/game/CardService";
import { ProfileService } from "../database/services/game/ProfileService";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { createMessage } from "../discord/message/createMessage";
import { ReactionCollector } from "eris-collector";
import { addReaction } from "../discord/message/addReaction";
import { editMessage } from "../discord/message/editMessage";
import { AlbumService } from "../database/services/game/AlbumService";
import { checkPermission } from "../ZephyrUtils";
import { MockUserCard } from "../../structures/game/UserCard";
import { Frames } from "../cosmetics/Frames";
import { Logger } from "../logger/Logger";

export async function useFrame(
  msg: Message,
  profile: GameProfile,
  parameters: string[],
  item: PrefabItem
): Promise<void> {
  const cardIdentifier = parameters[0];
  if (!cardIdentifier) throw new ZephyrError.InvalidCardReferenceError();

  if (isNaN(parseInt(cardIdentifier, 36)))
    throw new ZephyrError.InvalidCardReferenceError();

  const card = await CardService.getUserCardByIdentifier(cardIdentifier);
  if (card.discordId !== msg.author.id)
    throw new ZephyrError.NotOwnerOfCardError(card);

  if (card.wear !== 5)
    throw new ZephyrError.CardConditionTooLowError(card.wear, 5);

  const isInAlbum = await AlbumService.cardIsInAlbum(card);
  if (isInAlbum) throw new ZephyrError.CardInAlbumError(card);

  const baseCard = Zephyr.getCard(card.baseCardId)!;
  const frame = Frames.getFrameByName(item.names[0]);

  if (frame!.id === card.frameId)
    throw new ZephyrError.DuplicateFrameError(card, frame!);

  const mockCard = new MockUserCard({
    id: card.id,
    baseCard: baseCard,
    serialNumber: card.serialNumber,
    frame: frame!,
    dye: card.dye,
  });

  const preview = await CardService.generateCardImage(mockCard);

  const embed = new MessageEmbed(`Apply Frame`, msg.author)
    .setDescription(
      `Really apply **${item.names[0]}** to \`${card.id.toString(36)}\`?`
    )
    .setImage(`attachment://preview.png`);

  const confirmation = await createMessage(msg.channel, embed, {
    files: [{ file: preview, name: "preview.png" }],
  });

  const confirmed: boolean = await new Promise(async (res, _req) => {
    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id &&
      emoji.id === Zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(Zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      Logger.error(e);
      res(false);
    });

    collector.on("collect", async () => {
      res(true);
      collector.stop();
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") res(false);
    });

    await addReaction(
      confirmation,
      `check:${Zephyr.config.discord.emojiId.check}`
    );
  });

  if (checkPermission(`manageMessages`, msg.channel))
    await confirmation.removeReactions();

  if (!confirmed) {
    await editMessage(
      confirmation,
      embed.setFooter(`🕒 This confirmation has expired.`)
    );
    return;
  }

  await confirmation.delete();

  const refetchCard = await card.fetch();
  if (refetchCard.discordId !== msg.author.id)
    throw new ZephyrError.NotOwnerOfCardError(refetchCard);

  const newCard = await CardService.changeCardFrame(card, frame!.id);

  await ProfileService.removeItems(profile, [{ item: item, count: 1 }]);

  embed.setDescription(
    `You applied **${item.names[0]}** to \`${card.id.toString(36)}\`.`
  );
  embed.setImage(`attachment://success.png`);
  await createMessage(msg.channel, embed, {
    files: [{ file: newCard, name: "success.png" }],
  });

  return;
}
