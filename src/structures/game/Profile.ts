import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Profile {
  /* Currencies */
  bits: number;
  premium_currency: number;
  cubits: number;

  /* Vault */
  bits_vault: number;
  cubits_vault: number;
  bits_vault_max: number;
  cubits_vault_max: number;
  cards_vault_max: number;

  /* Profile */
  discord_id: string;
  private: boolean;
  blurb: string;
  patron: number;
  blacklisted: boolean;

  /* Timestamps */
  daily_last: string;
  drop_next: string;
  claim_next: string;
  vote_last: string | null;

  /* Reminders */
  claim_reminder: boolean;
  claim_reminded: boolean;
  drop_reminder: boolean;
  drop_reminded: boolean;
  vote_reminder: boolean;
  vote_reminded: boolean;

  /* Boosters */
  booster_group: number | null;
  booster_expiry: string | null;

  /* Other */
  daily_streak: number;
  created_at: string;
}

export class GameProfile {
  /* Currencies */
  bits: number;
  cubits: number;
  premiumCurrency: number;

  /* Vault */
  bitsVault: number;
  cubitsVault: number;
  bitsVaultMax: number;
  cubitsVaultMax: number;
  cardsVaultMax: number;

  /* Profile */
  discordId: string;
  private: boolean;
  blurb: string;
  patron: number;
  blacklisted: boolean;

  /* Timestamps */
  dailyLast: string;
  dropNext: string;
  claimNext: string;
  voteLast: string | null;

  /* Reminders */
  dropReminder: boolean;
  dropReminded: boolean;
  claimReminder: boolean;
  claimReminded: boolean;
  voteReminder: boolean;
  voteReminded: boolean;

  /* Boosters */
  boosterGroup?: number;
  boosterExpiry?: string;

  /* Other */
  dailyStreak: number;
  createdAt: string;

  constructor(data: Profile) {
    /* Currencies */
    this.bits = data.bits;
    this.cubits = data.cubits;
    this.premiumCurrency = data.premium_currency;

    /* Vault */
    this.bitsVault = data.bits_vault;
    this.bitsVaultMax = data.bits_vault_max;
    this.cubitsVault = data.cubits_vault;
    this.cubitsVaultMax = data.cubits_vault_max;
    this.cardsVaultMax = data.cards_vault_max;

    /* Profile */
    this.discordId = data.discord_id;
    this.private = data.private;
    this.blurb = data.blurb;
    this.patron = data.patron;
    this.blacklisted = data.blacklisted;

    /* Timestamps */
    this.dailyLast = data.daily_last;
    this.dropNext = data.drop_next;
    this.claimNext = data.claim_next;
    this.voteLast = data.vote_last;

    /* Reminders */
    this.dropReminder = data.drop_reminder;
    this.dropReminded = data.drop_reminded;
    this.claimReminder = data.claim_reminder;
    this.claimReminded = data.claim_reminded;
    this.voteReminder = data.vote_reminder;
    this.voteReminded = data.vote_reminded;

    /* Boosters */
    this.boosterGroup = data.booster_group || undefined;
    this.boosterExpiry = data.booster_expiry || undefined;

    /* Other */
    this.dailyStreak = data.daily_streak;
    this.createdAt = data.created_at;
  }

  public async fetch(): Promise<GameProfile> {
    return await ProfileService.getProfile(this.discordId, false);
  }
}
