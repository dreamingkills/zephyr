import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ViewAlbums extends BaseCommand {
  id = `crystallized`;
  names = [`album`, `a`];
  description = `Shows you an album.`;
  usage = [
    `$CMD$ <album> [page]`,
    `$CMD$ <@user> <album> [page]`,
    `$CMD$ <user id> <album> [page]`,
  ];

  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidAlbumNameError();

    let targetProfile = profile;
    let targetUser = msg.author;
    let albumQuery = options[0].toLowerCase();
    let page = 1;

    if (options.length === 2 && !msg.mentions[0]) {
      if (options[1].length < 17 && !isNaN(parseInt(options[1]))) {
        page = parseInt(options[1]);
      } else {
        const userId = options[0];

        if (isNaN(parseInt(userId)) || userId.length < 17)
          throw new ZephyrError.InvalidSnowflakeError();

        const fetchUser = await Zephyr.fetchUser(userId);

        if (!fetchUser) throw new ZephyrError.UserNotFoundError();

        targetUser = fetchUser;
        targetProfile = await ProfileService.getProfile(targetUser.id);
        albumQuery = options[1].toLowerCase();
      }
    } else if (options.length === 2 && msg.mentions[0]) {
      targetUser = msg.mentions[0];
      targetProfile = await ProfileService.getProfile(targetUser.id);
      albumQuery = options[1].toLowerCase();
    } else if (options.length >= 3) {
      if (msg.mentions[0]) {
        targetUser = msg.mentions[0];
        targetProfile = await ProfileService.getProfile(targetUser.id);
        albumQuery = options[1].toLowerCase();
        page = parseInt(options[2]);
      } else {
        const userId = options[0];

        if (isNaN(parseInt(userId)) || userId.length < 17)
          throw new ZephyrError.InvalidSnowflakeError();

        const fetchUser = await Zephyr.fetchUser(userId);

        if (!fetchUser) throw new ZephyrError.UserNotFoundError();

        targetUser = fetchUser;
        targetProfile = await ProfileService.getProfile(targetUser.id);
        albumQuery = options[1].toLowerCase();
        page = parseInt(options[2]);
      }
    }

    const targetAlbum = await AlbumService.getAlbumByName(
      albumQuery,
      targetUser,
      msg.author
    );

    if (page > targetAlbum.pages || page < 1 || isNaN(page))
      throw new ZephyrError.InvalidPageError();

    const albumCards = await AlbumService.getCardsByAlbum(targetAlbum);

    const image = await AlbumService.checkCacheForAlbum(
      targetAlbum,
      albumCards.filter(
        (a) => a.slot + 1 >= page * 8 - 8 && a.slot + 1 <= page * 8
      ),
      page
    );

    const embed = new MessageEmbed(`Album`, msg.author)
      .setDescription(
        `Album: \`${targetAlbum.name.toLowerCase()}\`\nBackground: \`${
          targetAlbum.backgroundName
        }\`\nOwner: ${
          targetUser
            ? targetProfile.private &&
              targetProfile.discordId !== profile.discordId
              ? `*Private User*`
              : `**${targetUser.tag}**`
            : `*Unknown User*`
        }`
      )
      .setImage(`attachment://album-${targetAlbum.id}-${page}.jpg`);

    await this.send(msg.channel, embed, {
      files: [{ file: image, name: `album-${targetAlbum.id}-${page}.jpg` }],
    });

    return;
  }
}
