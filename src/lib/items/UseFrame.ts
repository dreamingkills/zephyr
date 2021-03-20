import { Message, PartialEmoji } from "eris";
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

export async function useFrame(
  msg: Message,
  profile: GameProfile,
  parameters: string[],
  item: PrefabItem,
  zephyr: Zephyr
) {
  const cardIdentifier = parameters[0];
  if (!cardIdentifier) throw new ZephyrError.InvalidCardReferenceError();

  if (isNaN(parseInt(cardIdentifier, 36)))
    throw new ZephyrError.InvalidCardReferenceError();

  const card = await CardService.getUserCardByIdentifier(cardIdentifier);
  if (card.discordId !== msg.author.id)
    throw new ZephyrError.NotOwnerOfCardError(card);

  const frame = await CardService.getFrameByName(item.names[0]);

  card.dyeMaskUrl = frame.dyeMaskUrl;
  card.frameUrl = frame.frameUrl;
  card.textColor = frame.textColor;
  console.log(frame.textColor.toString());

  const preview = await CardService.generateCardImage(card, zephyr);

  const embed = new MessageEmbed(`Apply Frame`, msg.author)
    .setDescription(
      `Really apply **${item.names[0]}** to \`${card.id.toString(36)}\`?`
    )
    .setImage(`attachment://preview.png`);

  const confirmation = await createMessage(msg.channel, embed, {
    file: { file: preview, name: "preview.png" },
  });

  const confirmed: boolean = await new Promise(async (res, _req) => {
    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      console.log(e);
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
      `check:${zephyr.config.discord.emojiId.check}`
    );
  });

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

  const newCard = await CardService.changeCardFrame(card, frame.id, zephyr);

  await ProfileService.removeItems(profile, [{ item: item, count: 1 }]);

  embed.setDescription(
    `You applied **${item.names[0]}** to \`${card.id.toString(36)}\`.`
  );
  embed.setImage(`attachment://success.png`);
  await createMessage(msg.channel, embed, {
    file: { file: newCard, name: "success.png" },
  });

  return;
}
