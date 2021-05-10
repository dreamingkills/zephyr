import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { CardService } from "../../../lib/database/services/game/CardService";
import { GameAlbum, GameAlbumCard } from "../../../structures/game/Album";

export default class AddCardToAlbum extends BaseCommand {
  id = `maybe`;
  names = [`addcardtoalbum`, `aa`];
  description = `Adds a card to an album.`;
  usage = [`$CMD$ <album> <card> [page] [slot]`];
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

    if (targetAlbumCards.length >= targetAlbum.pages * 8)
      throw new ZephyrError.AlbumFullError();

    const targetCard = await CardService.getUserCardByIdentifier(options[1]);
    if (targetCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(targetCard);

    const isInAlbum = await AlbumService.cardIsInAlbum(targetCard);
    if (isInAlbum) throw new ZephyrError.CardAlreadyInAlbumError(targetCard);

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

        targetSlot = trueSlot;
      } else {
        const firstSlot = this.getFirstFreeSlot(
          targetAlbumCards.filter(
            (a) => a.slot >= page * 8 - 8 && a.slot <= page * 8
          ),
          page
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
        targetAlbumCards.filter(
          (a) => a.slot >= firstFreePage * 8 - 8 && a.slot <= firstFreePage * 8
        ),
        targetPage
      );

      if (firstFreeSlot === undefined) throw new ZephyrError.AlbumFullError();

      targetSlot = firstFreeSlot!;
    }

    const buffer = await AlbumService.addCardToAlbum(
      targetAlbum,
      targetCard,
      targetSlot,
      targetPage
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
      files: [
        {
          file: buffer,
          name: `album-${targetAlbum.id}-${Math.max(
            1,
            Math.ceil(targetSlot / 8)
          )}.png`,
        },
      ],
    });
    return;
  }

  private getFirstFreePage(
    album: GameAlbum,
    cards: GameAlbumCard[]
  ): number | undefined {
    for (let page = 1; page <= album.pages; page++) {
      const firstFreeSlot = this.getFirstFreeSlot(
        cards.filter((a) => a.slot >= page * 8 - 8 && a.slot <= page * 8),
        page
      );

      if (firstFreeSlot !== undefined && firstFreeSlot >= 0) {
        return page;
      }
    }
  }

  private getFirstFreeSlot(
    cards: GameAlbumCard[],
    page: number
  ): number | undefined {
    const cardsOnPage = cards.filter(
      (a) => a.slot >= page * 8 - 8 && a.slot <= page * 8
    );

    for (let i = page * 8 - 8; i <= page * 8; i++) {
      if (!cardsOnPage.find((c) => c.slot === i)) {
        return i;
      }
    }
    return;
  }
}
