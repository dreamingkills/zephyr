import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";

export default class RenameAlbum extends BaseCommand {
  names = ["renamealbum", "ra"];
  usage = ["$CMD$ <album name> <new name>"];
  description = "Changes the name of an album.";
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidAlbumNameError();

    const targetAlbum = await AlbumService.getAlbumByName(
      options[0].toLowerCase(),
      msg.author,
      msg.author
    );

    if (!options[1]) throw new ZephyrError.UnspecifiedNewAlbumNameError();

    const newName = options[1].toLowerCase().trim();

    if (newName.length > 12)
      throw new ZephyrError.InvalidAlbumNameCreationError();

    const allAlbums = await AlbumService.getAlbumsByProfile(profile);

    const nameTaken = allAlbums.find((a) => a.name.toLowerCase() === newName);
    if (nameTaken) throw new ZephyrError.AlbumNameTakenError(newName);

    const newAlbum = await AlbumService.changeAlbumName(targetAlbum, newName);

    const embed = new MessageEmbed(`Rename Album`, msg.author).setDescription(
      `Your album \`${targetAlbum.name}\` was changed to \`${newAlbum.name}\`.`
    );

    await this.send(msg.channel, embed);

    return;
  }
}
