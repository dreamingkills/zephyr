import { AlbumService } from "../../lib/database/services/game/AlbumService";

export interface Album {
  id: number;
  discord_id: string;
  album_name: string;
  pages: number;
  background_id: number;
  background_name: string;
  image_url: string;
}

export interface AlbumCard {
  id: number;
  card_id: number;
  album_id: number;
  slot: number;
}
export class GameAlbumCard {
  id: number;
  cardId: number;
  albumId: number;
  slot: number;

  constructor(data: AlbumCard) {
    this.id = data.id;
    this.cardId = data.card_id;
    this.albumId = data.album_id;
    this.slot = data.slot;
  }
}

export class GameAlbum {
  id: number;
  discordId: string;
  name: string;
  pages: number;

  backgroundId: number;
  backgroundName: string;
  backgroundUrl: string;
  constructor(data: Album) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.name = data.album_name;
    this.pages = data.pages;

    this.backgroundId = data.background_id;
    this.backgroundName = data.background_name;
    this.backgroundUrl = data.image_url;
  }

  public async fetch(): Promise<GameAlbum> {
    return await AlbumService.getAlbumById(this.id);
  }
}
