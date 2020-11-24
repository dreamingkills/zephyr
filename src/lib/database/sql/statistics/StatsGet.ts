import { DB, DBClass } from "../..";

export abstract class StatsGet extends DBClass {
  public static async getNumberOfProfiles(): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM profile;`
    )) as { count: number }[];
    return query[0].count;
  }
}
