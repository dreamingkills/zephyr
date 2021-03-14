import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";

export default class RemoveCardFromAlbum extends BaseCommand {
  id = `fireside`;
  names = [`removecardfromalbum`, `rc`];
  usage = [`$CMD$ <card>`];
  description = `Removes a card from an album.`;
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidCardReferenceError();

    const targetCard = await CardService.getUserCardByIdentifier(options[0]);

    if (targetCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(targetCard);

    const isInAlbum = await AlbumService.cardIsInAlbum(targetCard);

    if (!isInAlbum) throw new ZephyrError.CardNotInAlbumError(targetCard);

    const albumCards = await AlbumService.getCardsByAlbum(isInAlbum);
    const page = Math.max(
      1,
      Math.ceil(albumCards.find((c) => c.card.id === targetCard.id)!.slot / 8)
    );

    await AlbumService.removeCardsFromAlbums(
      [targetCard],
      [isInAlbum],
      this.zephyr
    );

    await AlbumService.updateAlbumCache(
      isInAlbum,
      albumCards.filter(
        (c) =>
          c.card.id !== targetCard.id &&
          c.slot >= page * 8 - 8 &&
          c.slot <= page * 8
      ),
      page,
      this.zephyr
    );

    const embed = new MessageEmbed(`Remove Card`, msg.author).setDescription(
      `\`${targetCard.id.toString(
        36
      )}\` was removed from \`${isInAlbum.name.toLowerCase()}\`.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
