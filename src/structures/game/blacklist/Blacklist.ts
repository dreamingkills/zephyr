import { BlacklistService } from "../../../lib/database/services/meta/BlacklistService";

export interface Blacklist {
  id: number;
  discord_id: string;
  reason: string;
  moderator_id: string;
  active: boolean;
  created_at: string;
  quashed_by: string;
  quash_note: string;
}

export class GameBlacklist {
  id: number;
  discordId: string;
  reason: string;
  moderator: string;
  active: boolean;
  createdAt: string;
  quasher: string;
  quashNote: string;

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
