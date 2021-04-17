import { DB } from "../../..";
import {
  Album,
  AlbumBackground,
  AlbumCard,
  GameAlbum,
  GameAlbumBackground,
  GameAlbumCard,
} from "../../../../../structures/game/Album";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { User } from "eris";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { GameProfile } from "../../../../../structures/game/Profile";

export async function getAlbumById(id: number): Promise<GameAlbum> {
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

export async function getAlbumByName(
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

export async function getAllBackgrounds(): Promise<GameAlbumBackground[]> {
  const query = (await DB.query(
    `
      SELECT
        album_background.id,
        album_background.background_name,
        album_background.image_url
      FROM
        album_background;
      `
  )) as AlbumBackground[];

  return query.map((b) => new GameAlbumBackground(b));
}

export async function getNumberOfAlbumsByProfile(
  profile: GameProfile
): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM album WHERE discord_id=?;`,
    [profile.discordId]
  )) as { count: number }[];

  return query[0]?.count || 0;
}

export async function getAlbumsByProfile(
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
export async function getCardsByAlbum(
  album: GameAlbum
): Promise<GameAlbumCard[]> {
  const query = (await DB.query(
    `
      SELECT
       album_card.id,
       album_card.card_id,
       album_card.album_id,
       album_card.slot
      FROM 
        album_card
      WHERE
        album_card.album_id=?;
      `,
    [album.id]
  )) as AlbumCard[];

  return query.map((q) => new GameAlbumCard(q));
}

export async function getNumberOfCardsByAlbum(
  album: GameAlbum
): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM album_card WHERE album_id=?;`,
    [album.id]
  )) as { count: number }[];

  return query[0]?.count || 0;
}

export async function cardIsInAlbum(
  card: GameUserCard
): Promise<GameAlbum | undefined> {
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
      FROM
        album_card
      LEFT JOIN album
        ON album.id=album_card.album_id
      LEFT JOIN album_background
        ON album_background.id=album.background_id
      WHERE card_id=?;
      `,
    [card.id]
  )) as Album[];

  return query[0] ? new GameAlbum(query[0]) : undefined;
}

export async function getCardsInAlbums(
  profile: GameProfile
): Promise<GameAlbumCard[]> {
  const query = (await DB.query(
    `
    SELECT
      album_card.id,
      album_card.album_id,
      album_card.card_id,
      album_card.slot
    FROM
      album_card
    LEFT JOIN album
      ON album.id=album_card.album_id
    WHERE
      album.discord_id=?;
    `,
    [profile.discordId]
  )) as AlbumCard[];

  return query.map((q) => new GameAlbumCard(q));
}

export * as AlbumGet from "./AlbumGet";
