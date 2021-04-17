import { Zephyr } from "../../structures/client/Zephyr";
import { PrefabItem } from "../../structures/item/PrefabItem";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { CardService } from "../database/services/game/CardService";
import { ProfileService } from "../database/services/game/ProfileService";
import { GameProfile } from "../../structures/game/Profile";
import { createMessage } from "../discord/message/createMessage";
import { MessageCollector } from "eris-collector";
import { editMessage } from "../discord/message/editMessage";
import { AlbumService } from "../database/services/game/AlbumService";
import { deleteMessage } from "../discord/message/deleteMessage";
import { Stickers } from "../cosmetics/Stickers";

export async function useSticker(
  msg: Message,
  profile: GameProfile,
  parameters: string[],
  item: PrefabItem,
  zephyr: Zephyr
): Promise<void> {
  const targetSticker = Stickers.getStickerByItemId(item.id);

  if (!targetSticker) throw new ZephyrError.NoStickerBoundToItemError(item);

  const card = await CardService.getUserCardByIdentifier(parameters[0]);

  if (card.discordId !== profile.discordId)
    throw new ZephyrError.NotOwnerOfCardError(card);

  if (card.wear !== 5)
    throw new ZephyrError.CardConditionTooLowError(card.wear, 5);

  const isInAlbum = await AlbumService.cardIsInAlbum(card);
  if (isInAlbum) throw new ZephyrError.CardInAlbumError(card);

  const cardStickers = await CardService.getCardStickers(card);
  if (cardStickers.length >= 3)
    throw new ZephyrError.TooManyStickersError(card);

  const preview = await CardService.generateStickerPreview(card, zephyr);

  const embed = new MessageEmbed(`Add Sticker`, msg.author)
    .setDescription(
      `Please enter the position (number) you'd like to place your sticker on.`
    )
    .setImage(`attachment://sticker-preview-${card.id}.png`)
    .setFooter(`Enter a number 1-20.`);

  const previewMessage = await createMessage(msg.channel, embed, {
    files: [
      {
        file: preview,
        name: `sticker-preview-${card.id}.png`,
      },
    ],
  });

  const position: number = await new Promise(async (res, _req) => {
    const filter = (m: Message) =>
      parseInt(m.content) >= 1 &&
      parseInt(m.content) <= 20 &&
      m.author.id === msg.author.id;

    const collector = new MessageCollector(zephyr, msg.channel, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      console.log(e);
      res(-1);
    });

    collector.on("collect", async (m: Message) => {
      res(parseInt(m.content));
    });

    collector.on(`end`, async (_collected: any, reason: string) => {
      if (reason === "time") res(-1);
    });
  });

  if (position < 0) {
    await editMessage(
      previewMessage,
      embed.setFooter(`🕒 This preview has expired.`)
    );
    return;
  }

  await deleteMessage(previewMessage);

  if (cardStickers.filter((s) => s.position === position)[0])
    throw new ZephyrError.StickerSlotTakenError(card, position);

  await ProfileService.removeItems(profile, [{ item: item, count: 1 }]);

  const addedSticker = await CardService.addStickerToCard(
    card,
    targetSticker,
    position
  );
  const newCard = await CardService.updateCardCache(addedSticker, zephyr);

  const successEmbed = new MessageEmbed(`Add Sticker`, msg.author)
    .setDescription(
      `You placed a **${item.names[0]}** at position **${position}**.`
    )
    .setImage(`attachment://sticker-added-${card.id}.png`);

  await createMessage(msg.channel, successEmbed, {
    files: [{ file: newCard, name: `sticker-added-${card.id}.png` }],
  });
  return;
}
