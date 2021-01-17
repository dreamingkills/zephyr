import { DB, DBClass } from "../../..";
import { GameAlbum } from "../../../../../structures/game/Album";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { AlbumService } from "../../../services/game/AlbumService";

export abstract class AlbumSet extends DBClass {
  public static async createAlbum(
    name: string,
    owner: GameProfile
  ): Promise<GameAlbum> {
    const query = (await DB.query(
      `INSERT INTO album (discord_id, album_name) VALUES (?, ?);`,
      [owner.discordId, name]
    )) as { insertId: number };

    return await AlbumService.getAlbumById(query.insertId);
  }

  public static async changeAlbumName(
    album: GameAlbum,
    newName: string
  ): Promise<void> {
    await DB.query(`UPDATE album SET album_name=? WHERE id=?;`, [
      newName,
      album.id,
    ]);

    return;
  }

  public static async addPageToAlbum(album: GameAlbum): Promise<void> {
    await DB.query(`UPDATE album SET pages=pages+1 WHERE id=?;`, [album.id]);

    return;
  }

  public static async setAlbumBackground(
    album: GameAlbum,
    backgroundId: number
  ): Promise<void> {
    await DB.query(`UPDATE album SET background_id=? WHERE id=?;`, [
      backgroundId,
      album.id,
    ]);

    return;
  }

  /*
        Cards
  */
  public static async addCardToAlbum(
    album: GameAlbum,
    card: GameUserCard,
    slot: number
  ): Promise<void> {
    await DB.query(
      `INSERT INTO album_card (album_id, card_id, slot) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE card_id=?;`,
      [album.id, card.id, slot, card.id]
    );

    return;
  }

  public static async removeCardsFromAlbum(
    cards: AlbumCard[] | GameUserCard[]
  ): Promise<void> {
    const ids = [];
    for (let card of cards) {
      if (card instanceof GameUserCard) {
        ids.push(card.id);
      } else ids.push(card.card.id);
    }

    await DB.query(`DELETE FROM album_card WHERE card_id IN (?);`, [ids]);

    return;
  }
}
