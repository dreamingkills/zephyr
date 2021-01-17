import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameAlbum } from "../../../structures/game/Album";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { ReactionCollector } from "eris-collector";

export default class ViewAlbums extends BaseCommand {
  names = ["albums", "albumlist", "al"];
  description = "Shows the albums owned by a user.";
  usage = ["$CMD$", "$CMD$ <@user>", "$CMD$ [user id]"];

  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let targetProfile: GameProfile;
    let targetUser;

    if (!options[0]) {
      targetProfile = profile;
      targetUser = msg.author;
    } else if (msg.mentions[0]) {
      targetUser = await this.zephyr.fetchUser(msg.mentions[0].id);

      if (!targetUser) throw new ZephyrError.InvalidMentionError();

      targetProfile = await ProfileService.getProfile(targetUser.id);
    } else {
      if (isNaN(parseInt(options[0])) || options[0].length < 17)
        throw new ZephyrError.InvalidSnowflakeError();

      targetUser = await this.zephyr.fetchUser(options[0]);

      if (!targetUser) throw new ZephyrError.InvalidSnowflakeError();

      targetProfile = await ProfileService.getProfile(targetUser.id);
    }

    const numberOfAlbums = await AlbumService.getNumberOfAlbumsByProfile(
      targetProfile
    );

    const maxPage = Math.ceil(numberOfAlbums / 10);
    let page = 1;

    const albums = await AlbumService.getAlbumsByProfile(targetProfile);

    const embed = new MessageEmbed(`Albums`, msg.author).setTitle(
      `${targetUser.tag}'s Albums`
    );

    if (albums.length === 0) {
      embed.setDescription(
        `${
          targetUser.id === msg.author.id
            ? `You have`
            : `**${targetUser.tag}** has`
        } no albums.`
      );

      await this.send(msg.channel, embed);
      return;
    }

    const albumText = await this.renderAlbums(
      albums.slice(page * 10 - 10, page * 10)
    );
    embed
      .setDescription(albumText.join("\n"))
      .setFooter(`Page ${page} of ${maxPage} • ${numberOfAlbums} albums`);

    const albumsMessage = await this.send(msg.channel, embed);

    if (maxPage === 1) return;

    const filter = (_m: Message, _emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id;

    const collector = new ReactionCollector(
      this.zephyr,
      albumsMessage,
      filter,
      {
        time: 2 * 60 * 1000,
      }
    );

    collector.on(
      "collect",
      async (_m: Message, emoji: PartialEmoji, userId: string) => {
        if (emoji.name === "⏮" && page !== 1) page = 1;
        if (emoji.name === "◀" && page !== 1) page--;
        // numbers
        if (emoji.name === "▶" && page !== maxPage) page++;
        if (emoji.name === "⏭" && page !== maxPage) page = maxPage;

        const newAlbumText = await this.renderAlbums(
          albums.slice(page * 10 - 10, page * 10)
        );

        embed
          .setDescription(newAlbumText.join("\n"))
          .setFooter(`Page ${page} of ${maxPage} • ${numberOfAlbums} albums`);

        await albumsMessage.edit({ embed });

        if (checkPermission("manageMessages", msg.textChannel, this.zephyr))
          await albumsMessage.removeReaction(emoji.name, userId);
      }
    );

    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    if (maxPage > 2) await this.react(albumsMessage, `⏮`);
    if (maxPage > 1) await this.react(albumsMessage, `◀`);
    if (maxPage > 1) await this.react(albumsMessage, `▶`);
    if (maxPage > 2) await this.react(albumsMessage, `⏭`);
  }

  private async renderAlbums(albums: GameAlbum[]): Promise<string[]> {
    let albumText = [];

    for (let album of albums) {
      const cardCount = await AlbumService.getNumberOfCardsByAlbum(album);
      albumText.push(
        `\`${album.name.toLowerCase()}\` - \`${
          album.pages
        }\` pages, \`${cardCount.toLocaleString()}\` cards`
      );
    }
    return albumText;
  }
}
