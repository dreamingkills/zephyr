import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class ViewAlbums extends BaseCommand {
  names = ["album", "a"];
  description = "Shows you an album.";
  usage = ["$CMD$ <album>", "$CMD$ <@user> <album>", "$CMD$ <user id> <album>"];

  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidAlbumNameError();

    let targetProfile;
    let targetUser;
    let albumQuery;

    if (!options[1]) {
      targetProfile = profile;
      targetUser = msg.author;
      albumQuery = options[0].toLowerCase();
    } else if (msg.mentions[0] && options[1]) {
      targetUser = await this.zephyr.fetchUser(msg.mentions[0].id);

      if (!targetUser) throw new ZephyrError.InvalidMentionError();

      targetProfile = await ProfileService.getProfile(targetUser.id);
      albumQuery = options.filter((o) => !o.includes("<@"))[0].toLowerCase();
    } else if (options[1]) {
      const userId = options[0];

      if (isNaN(parseInt(userId)) || userId.length < 17)
        throw new ZephyrError.InvalidSnowflakeError();

      targetUser = await this.zephyr.fetchUser(userId);

      if (!targetUser) throw new ZephyrError.InvalidSnowflakeError();

      targetProfile = await ProfileService.getProfile(targetUser.id);
      albumQuery = options[1].toLowerCase();
    } else throw new ZephyrError.InvalidAlbumNameError();

    const targetAlbum = await AlbumService.getAlbumByName(
      albumQuery,
      targetUser,
      msg.author
    );

    let page = 1;
    const albumCards = await AlbumService.getCardsByAlbum(targetAlbum);

    const image = await AlbumService.checkCacheForAlbum(
      targetAlbum,
      albumCards.slice(page * 8 - 8, page * 8),
      1,
      this.zephyr
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
      file: { file: image, name: `album-${targetAlbum.id}-${page}.jpg` },
    });

    return;
  }
}
