import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { GameTag } from "./Tag";

export interface Profile {
  /* Currencies */
  readonly bits: number;
  readonly premium_currency: number;
  readonly cubits: number;

  /* Vault */
  readonly bits_vault: number;
  readonly cubits_vault: number;
  readonly bits_vault_max: number;
  readonly cubits_vault_max: number;
  readonly cards_vault_max: number;

  /* Profile */
  readonly discord_id: string;
  readonly private: boolean;
  readonly blurb: string;
  readonly patron: 0 | 1 | 2 | 3 | 4 | 5;
  readonly blacklisted: boolean;

  /* Timestamps */
  readonly daily_last: string;
  readonly drop_next: string;
  readonly claim_next: string;
  readonly vote_last: string | null;

  /* Reminders */
  readonly claim_reminder: boolean;
  readonly claim_reminded: boolean;
  readonly drop_reminder: boolean;
  readonly drop_reminded: boolean;
  readonly vote_reminder: boolean;
  readonly vote_reminded: boolean;

  /* Boosters */
  readonly booster_group: number | null;
  readonly booster_uses: number | null;

  /* Other */
  readonly daily_streak: number;
  readonly created_at: string;
  readonly active_card: number;
}

export class GameProfile {
  /* Currencies */
  readonly bits: number;
  readonly cubits: number;
  readonly premiumCurrency: number;

  /* Vault */
  readonly bitsVault: number;
  readonly cubitsVault: number;
  readonly bitsVaultMax: number;
  readonly cubitsVaultMax: number;
  readonly cardsVaultMax: number;

  /* Profile */
  readonly discordId: string;
  readonly private: boolean;
  readonly blurb: string;
  readonly patron: 0 | 1 | 2 | 3 | 4 | 5;
  readonly blacklisted: boolean;

  /* Timestamps */
  readonly dailyLast: string;
  readonly dropNext: string;
  readonly claimNext: string;
  readonly voteLast: string | null;

  /* Reminders */
  readonly dropReminder: boolean;
  readonly dropReminded: boolean;
  readonly claimReminder: boolean;
  readonly claimReminded: boolean;
  readonly voteReminder: boolean;
  readonly voteReminded: boolean;

  /* Boosters */
  readonly boosterGroup?: number;
  readonly boosterUses?: number;

  /* Other */
  readonly dailyStreak: number;
  readonly createdAt: string;
  readonly activeCard: number;

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
    this.boosterUses = data.booster_uses || undefined;

    /* Other */
    this.dailyStreak = data.daily_streak;
    this.createdAt = data.created_at;
    this.activeCard = data.active_card;
  }

  public async fetch(): Promise<GameProfile> {
    return await ProfileService.getProfile(this.discordId, false);
  }

  public async getTags(): Promise<GameTag[]> {
    return await ProfileService.getTags(this);
  }
}
