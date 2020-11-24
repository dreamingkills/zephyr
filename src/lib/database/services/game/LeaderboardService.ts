import { GameProfile } from "../../../../structures/game/Profile";
import { LeaderboardGet } from "../../sql/game/leaderboard/LeaderboardGet";

export abstract class LeaderboardService {
  public static async getBitLeaderboard(
    page: number = 1
  ): Promise<GameProfile[]> {
    return await LeaderboardGet.getBitLeaderboard(page);
  }
  public static async getDailyStreakLeaderboard(
    page: number = 1
  ): Promise<GameProfile[]> {
    return await LeaderboardGet.getDailyStreakLeaderboard(page);
  }
}
