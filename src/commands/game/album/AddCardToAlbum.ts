import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { CardService } from "../../../lib/database/services/game/CardService";
import { GameAlbum } from "../../../structures/game/Album";

export default class AddCardToAlbum extends BaseCommand {
  names = ["addcardtoalbum", "aa"];
  description = "Adds a card to an album.";
  usage = ["$CMD$ <album> <card> [page] [slot]"];
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
    const targetAlbumCards = await AlbumService.getCardsByAlbum(targetAlbum);

    if (!options[1]) throw new ZephyrError.InvalidCardReferenceError();

    const albumCardsAmount = await AlbumService.getNumberOfCardsByAlbum(
      targetAlbum
    );

    if (albumCardsAmount >= targetAlbum.pages * 8)
      throw new ZephyrError.AlbumFullError();

    const targetCard = await CardService.getUserCardByIdentifier(options[1]);
    if (targetCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(targetCard);

    const isInAlbum = await AlbumService.cardIsInAlbum(targetCard);
    if (isInAlbum) throw new ZephyrError.CardInAlbumError(targetCard);

    let targetPage: number, targetSlot: number;

    if (options[2]) {
      const page = parseInt(options[2]);

      if (isNaN(page) || page < 1) throw new ZephyrError.InvalidPageError();
      if (page > targetAlbum.pages)
        throw new ZephyrError.NotEnoughAlbumPagesError();

      targetPage = page;
      if (options[3]) {
        const slot = parseInt(options[3]);
        const trueSlot = slot + (targetPage * 8 - 8) - 1;

        if (isNaN(slot) || slot > 8) throw new ZephyrError.InvalidSlotError();
        if (targetAlbumCards.find((c) => c.slot === trueSlot))
          throw new ZephyrError.AlbumSlotTakenError();

        targetSlot = slot;
      } else {
        const firstSlot = this.getFirstFreeSlot(
          targetAlbumCards.slice(targetPage * 8 - 8, targetPage * 8)
        );

        if (!firstSlot) throw new ZephyrError.AlbumPageFullError();
        targetSlot = firstSlot;
      }
    } else {
      const firstFreePage = this.getFirstFreePage(
        targetAlbum,
        targetAlbumCards
      );

      if (!firstFreePage) throw new ZephyrError.AlbumFullError();
      targetPage = firstFreePage;

      const firstFreeSlot = this.getFirstFreeSlot(
        targetAlbumCards.slice(targetPage * 8 - 8, targetPage * 8)
      );

      if (!firstFreeSlot) throw new ZephyrError.AlbumFullError();
      targetSlot = firstFreeSlot;
    }

    targetSlot += targetPage * 8 - 8 - 1;

    const buffer = await AlbumService.addCardToAlbum(
      targetAlbum,
      targetCard,
      targetSlot,
      this.zephyr
    );

    const embed = new MessageEmbed(`Album`, msg.author)
      .setDescription(
        `Album: \`${targetAlbum.name.toLowerCase()}\`\nBackground: \`${
          targetAlbum.backgroundName
        }\`\nOwner: **${msg.author.tag}**`
      )
      .setImage(
        `attachment://album-${targetAlbum.id}-${Math.max(
          1,
          Math.ceil(targetSlot / 8)
        )}.png`
      );

    await this.send(msg.channel, embed, {
      file: {
        file: buffer,
        name: `album-${targetAlbum.id}-${Math.max(
          1,
          Math.ceil(targetSlot / 8)
        )}.png`,
      },
    });
    return;
  }

  private getFirstFreePage(
    album: GameAlbum,
    cards: AlbumCard[]
  ): number | undefined {
    for (let i = 0; i < album.pages; i++) {
      const firstFreeSlot = this.getFirstFreeSlot(
        cards.slice(i * 8 - 8, i * 8)
      );

      if (firstFreeSlot) return Math.ceil(firstFreeSlot);
    }
  }

  private getFirstFreeSlot(cards: AlbumCard[]): number | undefined {
    for (let i = 0; i < 8; i++) {
      if (!cards.find((c) => c.slot === i)) {
        return i + 1;
      }
    }
    return;
  }
}
