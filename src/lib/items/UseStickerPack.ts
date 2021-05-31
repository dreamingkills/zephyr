import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { GameProfile } from "../../structures/game/Profile";
import { PrefabItem } from "../../structures/item/PrefabItem";
import { ProfileService } from "../database/services/game/ProfileService";
import { createMessage } from "../discord/message/createMessage";
import { getItemById } from "../../assets/Items";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { Stickers } from "../cosmetics/Stickers";
import { Zephyr } from "../../structures/client/Zephyr";
import { makeAndString } from "../utility/text/TextUtils";
import { MessageCollector } from "eris-collector";
import { Logger } from "../logger/Logger";
import { deleteMessage } from "../discord/message/deleteMessage";

export async function useStickerPack(
  msg: Message,
  profile: GameProfile,
  packItem: PrefabItem
): Promise<void> {
  const targetPack = Stickers.getStickerPackByItemId(packItem.id);

  if (!targetPack) throw new ZephyrError.NoPackBoundToItemError();

  if (targetPack.selection) {
    const stickerStrings = targetPack.stickers.map(
      (s) => `— \`${targetPack.stickers.indexOf(s) + 1}\` ${s.name}`
    );

    const confirmationEmbed = new MessageEmbed(
      `Sticker Pack`,
      msg.author
    ).setDescription(
      `**Please select a sticker by replying with a number!**` +
        `\n${stickerStrings.join(`\n`)}`
    );

    const confirmation = await createMessage(msg.channel, confirmationEmbed);

    const selection: number | undefined = await new Promise((res, _req) => {
      const filter = (m: Message) =>
        targetPack.stickers[parseInt(m.content) - 1] &&
        m.author.id === msg.author.id;

      const collector = new MessageCollector(Zephyr, msg.channel, filter, {
        time: 30000,
        max: 1,
      });

      collector.on("error", async (e: Error) => {
        Logger.error(
          `[Sticker Pack ID: ${targetPack.id}] Unexpected error opening selectable sticker pack: ${e}`
        );

        res(-1);
      });

      collector.on("collect", async (m: Message) => {
        res(parseInt(m.content) - 1);
      });

      collector.on("end", async (_c: any, reason: string) => {
        if (reason === "time") res(undefined);
      });
    });

    if (!selection && selection !== 0) {
      await confirmation.edit({
        embed: confirmationEmbed.setFooter(
          `🕒 This selection has timed out. Your sticker pack has not been used.`
        ),
      });

      return;
    }

    const targetSticker = targetPack.stickers[selection];

    const targetStickerItem = getItemById(targetSticker.itemId);

    if (!targetStickerItem) {
      Logger.error(`[Sticker ID: ${targetSticker.id}] Sticker has no item!`);
      throw new Error(`An unexpected error occurred.`);
    }

    await ProfileService.removeItems(profile, [{ item: packItem, count: 1 }]);
    await ProfileService.addItems(profile, [
      { item: targetStickerItem, count: 1 },
    ]);

    await deleteMessage(confirmation);

    const embed = new MessageEmbed(`Sticker Pack`, msg.author).setDescription(
      `:tada: You opened the **${targetPack.name}** and received **1x ${targetSticker.name}**!`
    );

    await createMessage(msg.channel, embed);
    return;
  }

  const pulls: { item: PrefabItem; count: number }[] = [];

  const weightings = targetPack.stickers.map((s) => s.rarity);

  while (pulls.reduce((a, b) => (a += b.count), 0) < targetPack.pulls) {
    const pull = Zephyr.chance.weighted(targetPack.stickers, weightings);

    const item = getItemById(pull.itemId);

    if (!item) continue;

    const alreadyRolled = pulls.find((i) => i.item.id === item.id);
    if (alreadyRolled) {
      alreadyRolled.count += 1;
    } else {
      pulls.push({ item, count: 1 });
    }
  }

  pulls.sort((a, b) => b.count - a.count);

  await ProfileService.removeItems(profile, [{ item: packItem, count: 1 }]);
  await ProfileService.addItems(profile, pulls);

  const pullStrings = pulls.map((p) => `**${p.count}x ${p.item.names[0]}**`);

  const embed = new MessageEmbed(`Sticker Pack`, msg.author).setDescription(
    `:tada: You opened the **${targetPack.name}** and received ${makeAndString(
      pullStrings
    )}!`
  );

  await createMessage(msg.channel, embed);
  return;
}
