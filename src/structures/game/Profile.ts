import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Profile {
  /*
      Currencies
  */
  bits: number;
  bits_bank: number;
  premium_currency: number;
  cubits: number;

  /*
      Profile
  */
  discord_id: string;
  private: boolean;
  blurb: string;
  patron: number;
  blacklisted: boolean;
  introduced: boolean;

  /*
      Timestamps
  */
  daily_last: string;
  drop_next: string;
  claim_next: string;
  vote_last: string | null;

  /*
      Reminders
  */
  claim_reminder: boolean;
  claim_reminded: boolean;
  drop_reminder: boolean;
  drop_reminded: boolean;
  vote_reminder: boolean;
  vote_reminded: boolean;

  /*
      Boosters
  */
  booster_group: number | null;
  booster_expiry: string | null;

  /*
      Other
  */
  daily_streak: number;
  created_at: string;
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
  dropReminder: boolean;
  dropReminded: boolean;
  claimNext: string;
  claimReminder: boolean;
  claimReminded: boolean;
  premiumCurrency: number;
  patron: number;
  blacklisted: boolean;
  cubits: number;
  voteLast: string | null;
  voteReminder: boolean;
  voteReminded: boolean;
  introduced: boolean;

  boosterGroup?: number;
  boosterExpiry?: string;

  createdAt: string;

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
    this.premiumCurrency = data.premium_currency;
    this.cubits = data.cubits;
    this.voteLast = data.vote_last;
    this.introduced = data.introduced;

    this.dropReminder = data.drop_reminder;
    this.dropReminded = data.drop_reminded;
    this.claimReminder = data.claim_reminder;
    this.claimReminded = data.claim_reminded;
    this.voteReminder = data.vote_reminder;
    this.voteReminded = data.vote_reminded;
    this.blacklisted = data.blacklisted;

    this.boosterGroup = data.booster_group || undefined;
    this.boosterExpiry = data.booster_expiry || undefined;

    this.createdAt = data.created_at;
  }

  public async fetch(): Promise<GameProfile> {
    return await ProfileService.getProfile(this.discordId, false);
  }
}
