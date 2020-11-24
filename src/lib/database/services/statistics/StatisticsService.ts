import { StatsGet } from "../../sql/statistics/StatsGet";

export abstract class StatisticsService {
  public static async getNumberOfProfiles(): Promise<number> {
    return await StatsGet.getNumberOfProfiles();
  }
}
