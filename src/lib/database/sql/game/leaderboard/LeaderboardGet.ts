import { DB, DBClass } from "../../..";
import { GameProfile, Profile } from "../../../../../structures/game/Profile";

export abstract class LeaderboardGet extends DBClass {
  private static entries = 10;
  public static async getBitLeaderboard(page: number): Promise<GameProfile[]> {
    const offset = page * this.entries - this.entries;
    const query = (await DB.query(
      `SELECT * FROM profile ORDER BY bits DESC LIMIT ${this.entries} OFFSET ?`,
      [offset]
    )) as Profile[];
    return query.map((p) => new GameProfile(p));
  }
}
