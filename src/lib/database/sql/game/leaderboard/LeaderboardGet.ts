import { DB, DBClass } from "../../..";
import { GameProfile, Profile } from "../../../../../structures/game/Profile";

export abstract class LeaderboardGet extends DBClass {
  private static entries = 10;
  public static async getBitLeaderboard(page: number): Promise<GameProfile[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT * FROM profile ORDER BY bits+bits_bank DESC LIMIT ? OFFSET ?`,
      [this.entries, offset]
    )) as Profile[];
    return query.map((p) => new GameProfile(p));
  }
  public static async getDailyStreakLeaderboard(
    page: number
  ): Promise<GameProfile[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT * FROM profile ORDER BY daily_streak DESC LIMIT ? OFFSET ?`,
      [this.entries, offset]
    )) as Profile[];
    return query.map((p) => new GameProfile(p));
  }
  public static async getCardLeaderboard(
    page: number
  ): Promise<{ profile: GameProfile; count: number }[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT profile.*, COUNT(*) as count FROM profile LEFT JOIN user_card ON user_card.discord_id=profile.discord_id WHERE NOT user_card.discord_id=0 GROUP BY profile.discord_id ORDER BY count DESC, user_card.discord_id LIMIT ? OFFSET ?;`,
      [this.entries, offset]
    )) as {
      discord_id: string;
      private: boolean;
      blurb: string;
      bits: number;
      bits_bank: number;
      daily_last: string;
      daily_streak: number;
      patron: number;
      count: number;
    }[];
    return query.map((p) => {
      return { profile: new GameProfile(p), count: p.count };
    });
  }
}
