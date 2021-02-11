import { DB, DBClass } from "../../..";
import { GameProfile, Profile } from "../../../../../structures/game/Profile";

export abstract class LeaderboardGet extends DBClass {
  private static entries = 10;

  public static async getBitLeaderboardCount(): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) as count FROM profile WHERE bits+bits_bank>0 AND blacklisted=0;`
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getBitLeaderboard(page: number): Promise<GameProfile[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT * FROM profile WHERE bits+bits_bank>0 AND blacklisted=0 ORDER BY bits+bits_bank DESC LIMIT ? OFFSET ?`,
      [this.entries, offset]
    )) as Profile[];
    return query.map((p) => new GameProfile(p));
  }

  public static async getDailyStreakLeaderboardCount(): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) as count FROM profile WHERE daily_streak>0 AND blacklisted=0;`
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getDailyStreakLeaderboard(
    page: number
  ): Promise<GameProfile[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT * FROM profile WHERE daily_streak>0 AND blacklisted=0 ORDER BY daily_streak DESC LIMIT ? OFFSET ?`,
      [this.entries, offset]
    )) as Profile[];
    return query.map((p) => new GameProfile(p));
  }

  public static async getCardLeaderboardCount(
    zephyrId: string
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM (SELECT profile.*, COUNT(*) AS count FROM profile LEFT JOIN user_card ON user_card.discord_id=profile.discord_id WHERE blacklisted=0 AND user_card.discord_id!=? GROUP BY profile.discord_id) q;`,
      [zephyrId]
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getCardLeaderboard(
    page: number,
    zephyrId: string
  ): Promise<{ profile: GameProfile; count: number }[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT profile.*, COUNT(*) as count FROM profile LEFT JOIN user_card ON user_card.discord_id=profile.discord_id WHERE blacklisted=0 AND user_card.discord_id!=? GROUP BY profile.discord_id ORDER BY count DESC, user_card.discord_id LIMIT ? OFFSET ?;`,
      [zephyrId, this.entries, offset]
    )) as {
      discord_id: string;
      private: boolean;
      blurb: string;
      bits: number;
      bits_bank: number;
      daily_last: string;
      daily_streak: number;
      claim_next: string;
      claim_reminder: boolean;
      claim_reminded: boolean;
      drop_next: string;
      drop_reminder: boolean;
      drop_reminded: boolean;
      dust_1: number;
      dust_2: number;
      dust_3: number;
      dust_4: number;
      dust_5: number;
      premium_currency: number;
      patron: number;
      count: number;
      blacklisted: boolean;
      cubits: number;
      vote_last: string | null;
      vote_reminder: boolean;
      vote_reminded: boolean;
      booster_group: number | null;
      booster_expiry: string | null;
      created_at: string;
    }[];
    return query.map((p) => {
      return { profile: new GameProfile(p), count: p.count };
    });
  }

  public static async getCubitLeaderboardCount(): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) as count FROM profile WHERE cubits>0 AND blacklisted=0;`
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getCubitLeaderboard(
    page: number
  ): Promise<GameProfile[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT * FROM profile WHERE cubits>0 AND blacklisted=0 ORDER BY cubits DESC LIMIT ? OFFSET ?`,
      [this.entries, offset]
    )) as Profile[];
    return query.map((p) => new GameProfile(p));
  }
}
