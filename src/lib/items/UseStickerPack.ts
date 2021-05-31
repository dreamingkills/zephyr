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

export async function useStickerPack(
  msg: Message,
  profile: GameProfile,
  packItem: PrefabItem
): Promise<void> {
  const targetPack = Stickers.getStickerPackByItemId(packItem.id);

  if (!targetPack) throw new ZephyrError.NoPackBoundToItemError();

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
