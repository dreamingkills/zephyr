import { BlacklistService } from "../../../lib/database/services/meta/BlacklistService";

export interface Blacklist {
  readonly id: number;
  readonly discord_id: string;
  readonly reason: string;
  readonly moderator_id: string;
  readonly active: boolean;
  readonly created_at: string;
  readonly quashed_by: string;
  readonly quash_note: string;
}

export class GameBlacklist {
  readonly id: number;
  readonly discordId: string;
  readonly reason: string;
  readonly moderator: string;
  readonly active: boolean;
  readonly createdAt: string;
  readonly quasher: string;
  readonly quashNote: string;

  constructor(blacklist: Blacklist) {
    this.id = blacklist.id;
    this.discordId = blacklist.discord_id;
    this.reason = blacklist.reason;
    this.moderator = blacklist.moderator_id;
    this.active = blacklist.active;
    this.createdAt = blacklist.created_at;
    this.quasher = blacklist.quashed_by;
    this.quashNote = blacklist.quash_note;
  }

  public async fetch(): Promise<GameBlacklist> {
    return await BlacklistService.getBlacklistById(this.id);
  }
}
