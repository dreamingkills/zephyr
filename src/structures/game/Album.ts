import { Image } from "canvas";
import { AlbumService } from "../../lib/database/services/game/AlbumService";

export interface Album {
  readonly id: number;
  readonly discord_id: string;
  readonly album_name: string;
  readonly pages: number;
  readonly background_id: number;
  readonly background_name: string;
  readonly image_url: string;
}

export interface AlbumCard {
  readonly id: number;
  readonly card_id: number;
  readonly album_id: number;
  readonly slot: number;
}

export interface AlbumBackground {
  readonly id: number;
  readonly background_name: string;
  readonly image_url: string;
}

export class GameAlbumCard {
  readonly id: number;
  readonly cardId: number;
  readonly albumId: number;
  readonly slot: number;

  constructor(data: AlbumCard) {
    this.id = data.id;
    this.cardId = data.card_id;
    this.albumId = data.album_id;
    this.slot = data.slot;
  }
}

export class GameAlbum {
  readonly id: number;
  readonly discordId: string;
  readonly name: string;
  readonly pages: number;

  readonly backgroundId: number;
  readonly backgroundName: string;
  readonly backgroundUrl: string;
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

export interface IntermediateBackground {
  readonly id: number;
  readonly background_name: string;
  readonly image: Image;
}

export class GameAlbumBackground {
  readonly id: number;
  readonly name: string;
  readonly image: Image;

  constructor(data: IntermediateBackground) {
    this.id = data.id;
    this.name = data.background_name;
    this.image = data.image;
  }
}
