import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Tag {
  readonly id: number;
  readonly discord_id: string;
  readonly tag_name: string;
  readonly emoji: string;
}

export class GameTag {
  readonly id: number;
  readonly discordId: string;
  readonly name: string;
  readonly emoji: string;
  constructor(data: Tag) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.name = data.tag_name;
    this.emoji = data.emoji;
  }

  public async fetch(): Promise<GameTag> {
    return await ProfileService.getTagById(this.id);
  }
}
