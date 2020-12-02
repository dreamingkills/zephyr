import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Profile {
  discord_id: string;
  private: boolean;
  blurb: string;
  bits: number;
  bits_bank: number;
  daily_last: string;
  daily_streak: number;
  drop_next: string;
  claim_next: string;
  patron: number;
}
export class GameProfile {
  discordId: string;
  private: boolean;
  blurb: string;
  bits: number;
  bitsBank: number;
  dailyLast: string;
  dailyStreak: number;
  dropNext: string;
  claimNext: string;
  patron: number;
  constructor(data: Profile) {
    this.discordId = data.discord_id;
    this.private = data.private;
    this.blurb = data.blurb;
    this.bits = data.bits;
    this.bitsBank = data.bits_bank;
    this.dailyLast = data.daily_last;
    this.dailyStreak = data.daily_streak;
    this.patron = data.patron;
    this.dropNext = data.drop_next;
    this.claimNext = data.claim_next;
  }

  public async fetch(): Promise<GameProfile> {
    return await ProfileService.getProfile(this.discordId, false);
  }
}
