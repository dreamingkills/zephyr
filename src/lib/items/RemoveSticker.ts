import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { CardService } from "../database/services/game/CardService";
import { createMessage } from "../discord/message/createMessage";
import { deleteMessage } from "../discord/message/deleteMessage";
import { editMessage } from "../discord/message/editMessage";
import { MessageCollector } from "eris-collector";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { Stickers } from "../cosmetics/Stickers";
import { Zephyr } from "../../structures/client/Zephyr";

export async function removeSticker(
  msg: Message,
  parameters: string[]
): Promise<void> {
  const targetCard = await CardService.getUserCardByIdentifier(parameters[0]);

  if (targetCard.discordId !== msg.author.id)
    throw new ZephyrError.NotOwnerOfCardError(targetCard);

  const targetStickers = (await CardService.getCardStickers(targetCard)).sort(
    (a, b) => a.position - b.position
  );

  if (targetStickers.length === 0)
    throw new ZephyrError.NoStickersOnCardError(targetCard);

  /* todo: extract this to its own function so we can reuse the logic in different items */
  const stickerChoiceEmbed = new MessageEmbed(`Remove Sticker`, msg.author)
    .setDescription(
      `Please choose a sticker to remove from your card.\n${targetStickers.map(
        (s, i) =>
          `\`${i + 1}\` **${
            Stickers.getStickerById(s.stickerId)?.name || `Unknown Sticker`
          }**`
      )}`
    )
    .setFooter(
      `This action is irreversible. The sticker will not be returned to your inventory.`
    );

  const stickerChoiceMessage = await createMessage(
    msg.channel,
    stickerChoiceEmbed
  );

  let choice: number = await new Promise(async (res, _req) => {
    const filter = (m: Message) =>
      targetStickers[parseInt(m.content) - 1] && m.author.id === msg.author.id;

    const collector = new MessageCollector(Zephyr, msg.channel, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      throw e;
    });

    collector.on(`collect`, async (m: Message) => {
      collector.stop();
      res(parseInt(m.content, 10));
    });

    collector.on(`end`, async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        res(-1);
      }
    });
  });

  if (!choice || choice < 0) {
    await editMessage(
      stickerChoiceMessage,
      stickerChoiceEmbed.setFooter(`🕒 This confirmation has expired.`)
    );
    return;
  }

  await deleteMessage(stickerChoiceMessage);

  const sticker = targetStickers[choice - 1];
  const stickerName =
    Stickers.getStickerById(sticker.stickerId)?.name || `Unknown Sticker`;

  if (!sticker) throw new ZephyrError.InvalidStickerError();

  const newCardImage = await CardService.removeCardSticker(targetCard, sticker);

  const embed = new MessageEmbed(`Remove Sticker`, msg.author)
    .setDescription(
      `You removed a${
        [`a`, `e`, `i`, `o`, `u`].includes(stickerName[0]) ? `n` : ``
      } **${stickerName} Sticker** from \`${targetCard.id.toString(36)}\`.`
    )
    .setImage(`attachment://newCard.png`);

  await createMessage(msg.channel, embed, {
    files: [{ file: newCardImage, name: `newCard.png` }],
  });
  return;
}
