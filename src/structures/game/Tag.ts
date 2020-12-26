import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Tag {
  id: number;
  discord_id: string;
  tag_name: string;
  emoji: string;
}

export class GameTag {
  id: number;
  discordId: string;
  name: string;
  emoji: string;
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
