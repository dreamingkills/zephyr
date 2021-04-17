import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { Zephyr } from "../../structures/client/Zephyr";
import { GameProfile } from "../../structures/game/Profile";
import { PrefabItem } from "../../structures/item/PrefabItem";
import { ProfileService } from "../database/services/game/ProfileService";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { createMessage } from "../discord/message/createMessage";
import { AlbumService } from "../database/services/game/AlbumService";

export async function useBackground(
  msg: Message,
  profile: GameProfile,
  parameters: string[],
  item: PrefabItem,
  zephyr: Zephyr
): Promise<void> {
  const albumName = parameters[0]?.toLowerCase();
  if (!albumName) throw new ZephyrError.InvalidAlbumNameError();

  const targetBackground = zephyr.getBackgroundByName(item.names[0]);

  if (!targetBackground) throw new ZephyrError.InvalidAlbumBackgroundError();

  const album = await AlbumService.getAlbumByName(
    albumName,
    msg.author,
    msg.author
  );

  if (album.backgroundId === targetBackground.id)
    throw new ZephyrError.DuplicateAlbumBackgroundError(targetBackground.name);

  const cards = await AlbumService.getCardsByAlbum(album);

  const newAlbum = await AlbumService.setAlbumBackground(
    album,
    targetBackground.id
  );

  const image = await AlbumService.updateAlbumCache(newAlbum, cards, 1, zephyr);

  await ProfileService.removeItems(profile, [{ item: item, count: 1 }]);

  const embed = new MessageEmbed(`Use Background`, msg.author)
    .setDescription(
      `The background of \`${newAlbum.name}\` was changed to **${targetBackground.name}**!`
    )
    .setImage(`attachment://album.png`);

  await createMessage(msg.channel, embed, {
    files: [{ file: image, name: `album.png` }],
  });

  return;
}
