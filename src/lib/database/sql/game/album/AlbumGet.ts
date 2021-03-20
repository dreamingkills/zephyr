import { DB, DBClass } from "../../..";
import { Album, GameAlbum } from "../../../../../structures/game/Album";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { User } from "eris";
import {
  GameUserCard,
  UserCard,
} from "../../../../../structures/game/UserCard";
import { GameProfile } from "../../../../../structures/game/Profile";

export abstract class AlbumGet extends DBClass {
  public static async getAlbumById(id: number): Promise<GameAlbum> {
    const query = (await DB.query(
      `SELECT
         album.id,
         album.discord_id,
         album.album_name,
         album.pages,
         album_background.id AS background_id,
         album_background.background_name,
         album_background.image_url
       FROM album
       LEFT JOIN album_background
         ON album_background.id=album.background_id
       WHERE album.id=?;`,
      [id]
    )) as Album[];

    if (!query[0]) throw new ZephyrError.NonexistentAlbumIdError();

    return new GameAlbum(query[0]);
  }

  public static async getAlbumByName(
    name: string,
    owner: User,
    sender: User
  ): Promise<GameAlbum> {
    const query = (await DB.query(
      `SELECT
        album.id,
        album.discord_id,
        album.album_name,
        album.pages,
        album_background.id AS background_id,
        album_background.background_name,
        album_background.image_url
       FROM album
       LEFT JOIN album_background
         ON album_background.id=album.background_id
       WHERE album_name=? AND discord_id=?;`,
      [name, owner.id]
    )) as Album[];

    if (!query[0])
      throw new ZephyrError.AlbumNotFoundError(
        owner.id === sender.id ? undefined : owner
      );

    return new GameAlbum(query[0]);
  }

  public static async getNumberOfAlbumsByProfile(
    profile: GameProfile
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM album WHERE discord_id=?;`,
      [profile.discordId]
    )) as { count: number }[];

    return query[0]?.count || 0;
  }

  public static async getAlbumsByProfile(
    profile: GameProfile
  ): Promise<GameAlbum[]> {
    const query = (await DB.query(
      `
      SELECT
        album.id,
        album.discord_id,
        album.album_name,
        album.pages,
        album_background.id AS background_id,
        album_background.background_name,
        album_background.image_url
      FROM album
      LEFT JOIN album_background
        ON album_background.id=album.background_id
      WHERE discord_id=?;`,
      [profile.discordId]
    )) as Album[];

    return query.map((a) => new GameAlbum(a));
  }

  /*
        Cards
  */
  public static async getCardsByAlbum(album: GameAlbum): Promise<AlbumCard[]> {
    const query = (await DB.query(
      `SELECT
        user_card.*,
        album_card.slot,
        card_frame.id AS frame_id,
        card_frame.frame_name,
        card_frame.frame_url,
        card_frame.dye_mask_url,
        card_frame.text_color_hex
      FROM 
        album_card
      LEFT JOIN
        user_card
      ON
        user_card.id=album_card.card_id
      LEFT JOIN
        card_frame
      ON
        user_card.frame=card_frame.id
      WHERE
        album_card.album_id=?;`,
      [album.id]
    )) as (UserCard & { slot: number })[];

    return query.map((c) => {
      return { card: new GameUserCard(c), slot: c.slot };
    });
  }

  public static async getNumberOfCardsByAlbum(
    album: GameAlbum
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM album_card WHERE album_id=?;`,
      [album.id]
    )) as { count: number }[];

    return query[0]?.count || 0;
  }

  public static async cardIsInAlbum(
    card: GameUserCard
  ): Promise<GameAlbum | undefined> {
    const query = (await DB.query(
      `SELECT
        album.id,
        album.discord_id,
        album.album_name,
        album.pages,
        album_background.id AS background_id,
        album_background.background_name,
        album_background.image_url
      FROM
        album_card
      LEFT JOIN album
        ON album.id=album_card.album_id
      LEFT JOIN album_background
        ON album_background.id=album.background_id
      WHERE card_id=?;`,
      [card.id]
    )) as Album[];

    return query[0] ? new GameAlbum(query[0]) : undefined;
  }
}
