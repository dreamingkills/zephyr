export interface Badge {
  readonly id: number;
  readonly badge_name: string;
  readonly badge_emoji: string;
}

export interface UserBadge {
  readonly id: number;
  readonly discord_id: string;
  readonly badge_id: number;
  readonly created_at: string;
  readonly badge_name: string;
  readonly badge_emoji: string;
}

export class GameBadge {
  readonly id: number;
  readonly badgeName: string;
  readonly badgeEmoji: string;

  constructor(badge: Badge) {
    this.id = badge.id;
    this.badgeName = badge.badge_name;
    this.badgeEmoji = badge.badge_emoji;
  }
}

export class GameUserBadge {
  readonly id: number;
  readonly discordId: string;
  readonly badgeId: number;
  readonly createdAt: string;
  readonly badgeName: string;
  readonly badgeEmoji: string;

  constructor(userBadge: UserBadge) {
    this.id = userBadge.id;
    this.discordId = userBadge.discord_id;
    this.badgeId = userBadge.badge_id;
    this.badgeName = userBadge.badge_name;
    this.badgeEmoji = userBadge.badge_emoji;
    this.createdAt = userBadge.created_at;
  }
}
