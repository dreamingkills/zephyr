import { createCanvas, loadImage } from "canvas";
import { User } from "eris";
import { Zephyr } from "../../../../structures/client/Zephyr";
import { GameAlbum, GameAlbumCard } from "../../../../structures/game/Album";
import { GameProfile } from "../../../../structures/game/Profile";
import { GameUserCard } from "../../../../structures/game/UserCard";
import { AlbumGet } from "../../sql/game/album/AlbumGet";
import { AlbumSet } from "../../sql/game/album/AlbumSet";
import { CardService } from "./CardService";
import fs from "fs/promises";

export abstract class AlbumService {
  public static async getAlbumById(id: number): Promise<GameAlbum> {
    return await AlbumGet.getAlbumById(id);
  }

  public static async getAlbumByName(
    name: string,
    owner: User,
    sender: User
  ): Promise<GameAlbum> {
    return await AlbumGet.getAlbumByName(name, owner, sender);
  }

  public static async getNumberOfAlbumsByProfile(
    profile: GameProfile
  ): Promise<number> {
    return await AlbumGet.getNumberOfAlbumsByProfile(profile);
  }

  public static async getAlbumsByProfile(
    profile: GameProfile
  ): Promise<GameAlbum[]> {
    return await AlbumGet.getAlbumsByProfile(profile);
  }

  public static async createAlbum(
    name: string,
    owner: GameProfile
  ): Promise<GameAlbum> {
    return await AlbumSet.createAlbum(name, owner);
  }

  public static async changeAlbumName(
    album: GameAlbum,
    newName: string
  ): Promise<GameAlbum> {
    await AlbumSet.changeAlbumName(album, newName);

    return await album.fetch();
  }

  public static async addPageToAlbum(album: GameAlbum): Promise<GameAlbum> {
    await AlbumSet.addPageToAlbum(album);

    return await album.fetch();
  }

  public static async getCardsByAlbum(
    album: GameAlbum
  ): Promise<GameAlbumCard[]> {
    return await AlbumGet.getCardsByAlbum(album);
  }

  public static async addCardToAlbum(
    album: GameAlbum,
    card: GameUserCard,
    slot: number,
    zephyr: Zephyr
  ): Promise<Buffer> {
    await AlbumSet.addCardToAlbum(album, card, slot);

    const page = Math.max(1, Math.ceil(slot / 8));
    const cards = await this.getCardsByAlbum(album);
    return await this.updateAlbumCache(
      album,
      cards.slice(page * 8 - 8, page * 8),
      page,
      zephyr
    );
  }

  public static async setAlbumBackground(
    album: GameAlbum,
    backgroundId: number
  ): Promise<GameAlbum> {
    await AlbumSet.setAlbumBackground(album, backgroundId);

    return await album.fetch();
  }

  public static async getNumberOfCardsByAlbum(
    album: GameAlbum
  ): Promise<number> {
    return await AlbumGet.getNumberOfCardsByAlbum(album);
  }

  public static async generateAlbumImage(
    album: GameAlbum,
    cards: GameAlbumCard[],
    _page: number,
    zephyr: Zephyr
  ): Promise<Buffer> {
    const canvas = createCanvas(1024, 700);
    const ctx = canvas.getContext("2d");

    const image = await loadImage(album.backgroundUrl);
    ctx.drawImage(image, 0, 0, 1024, 700);

    for (let card of cards) {
      const posX = 22 + 245 * (card.slot - Math.floor(card.slot / 4) * 4); // 25 + 350x
      const posY = 350 * Math.floor(card.slot / 4);

      const gameCard = await CardService.getUserCardById(card.cardId);

      const buffer = await CardService.checkCacheForCard(gameCard, zephyr);
      const image = await loadImage(buffer);
      ctx.drawImage(image, posX, posY, 245, 350);
    }

    return canvas.toBuffer("image/jpeg");
  }

  /*
      Caching
  */
  public static async updateAlbumCache(
    album: GameAlbum,
    cards: GameAlbumCard[],
    page: number,
    zephyr: Zephyr
  ): Promise<Buffer> {
    const collage = await this.generateAlbumImage(album, cards, page, zephyr);

    // fs will throw an error if the directory already exists.
    // TODO - Change this do detect directory, removing need for error handling.
    try {
      await fs.mkdir(`./cache/albums/${album.id}`);
    } catch (e) {}

    // Overwrite the cached card image.
    // The card image file stays in the temp folder while it's building.
    // Once it's finished, it's moved to the cache folder to avoid
    // showing users incomplete card images.
    await fs.writeFile(`./cache/albums/temp/${album.id}`, collage);
    await fs.rename(
      `./cache/albums/temp/${album.id}`,
      `./cache/albums/${album.id}/${page}`
    );

    return await fs.readFile(`./cache/albums/${album.id}/${page}`);
  }

  public static async checkCacheForAlbum(
    album: GameAlbum,
    cards: GameAlbumCard[],
    page: number,
    zephyr: Zephyr
  ): Promise<Buffer> {
    try {
      return await fs.readFile(`./cache/albums/${album.id}/${page}`);
    } catch (e) {
      return await this.updateAlbumCache(album, cards, page, zephyr);
    }
  }

  public static async removeCardsFromAlbums(
    cards: GameAlbumCard[] | GameUserCard[],
    albums: GameAlbum[],
    zephyr: Zephyr
  ): Promise<void> {
    await AlbumSet.removeCardsFromAlbum(cards);
    for (let album of albums) {
      const albumCards = await this.getCardsByAlbum(album);
      await this.updateAlbumCache(album, albumCards, 1, zephyr);
    }
  }

  public static async cardIsInAlbum(
    card: GameUserCard
  ): Promise<GameAlbum | undefined> {
    return await AlbumGet.cardIsInAlbum(card);
  }

  public static async getCardsInAlbums(
    profile: GameProfile
  ): Promise<GameAlbumCard[]> {
    return await AlbumGet.getCardsInAlbums(profile);
  }
}
