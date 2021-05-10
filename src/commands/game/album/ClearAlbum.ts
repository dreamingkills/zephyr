import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { ReactionCollector } from "eris-collector";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ClearAlbum extends BaseCommand {
  id = `arabella`;
  names = [`clearalbum`, `ca`];
  usage = ["$CMD$ <album name>"];
  description = "Clears all cards from an album.";
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidAlbumNameError();

    const targetAlbum = await AlbumService.getAlbumByName(
      options[0].toLowerCase(),
      msg.author,
      msg.author
    );

    const albumCards = await AlbumService.getCardsByAlbum(targetAlbum);

    if (albumCards.length < 1)
      throw new ZephyrError.AlbumEmptyError(targetAlbum);

    const confirmationEmbed = new MessageEmbed(
      `Clear Album`,
      msg.author
    ).setDescription(
      `Really remove **${albumCards.length.toLocaleString()}** cards from \`${
        targetAlbum.name
      }\`?`
    );

    const confirmation = await this.send(msg.channel, confirmationEmbed);

    let confirmed: boolean = await new Promise(async (res, _req) => {
      const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
        user.id === msg.author.id &&
        emoji.id === Zephyr.config.discord.emojiId.check;

      const collector = new ReactionCollector(Zephyr, confirmation, filter, {
        time: 15000,
        max: 1,
      });

      collector.on("error", async (e: Error) => {
        await this.handleError(msg, msg.author, e);
      });

      collector.on(`collect`, async () => {
        collector.stop();
        res(true);
      });

      collector.on(`end`, async (_collected: unknown, reason: string) => {
        if (reason === "time") {
          res(false);
        }
      });

      await this.react(
        confirmation,
        `check:${Zephyr.config.discord.emojiId.check}`
      );
    });

    if (!confirmed) {
      await this.edit(
        confirmation,
        confirmationEmbed.setFooter(`🕒 This confirmation has expired.`)
      );

      if (checkPermission(`manageMessages`, msg.channel))
        await confirmation.removeReactions();

      return;
    }

    await this.delete(confirmation);

    await AlbumService.removeCardsFromAlbums(albumCards, [targetAlbum]);

    const embed = new MessageEmbed(`Clear Album`, msg.author).setDescription(
      `All cards have been removed from \`${targetAlbum.name}\`.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
