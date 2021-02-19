import { DB, DBClass } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";

export abstract class ACGet extends DBClass {
  public static async getNumberOfClaimedCards(
    profile: GameProfile
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM claim WHERE claimer=?;`,
      [profile.discordId]
    )) as { count: number }[];
    return query[0]?.count || 0;
  }

  public static async getNumberOfVotes(profile: GameProfile): Promise<number> {
    const query = (await DB.query(
      `SELECT SUM(1 * (weekend+1)) AS count FROM vote WHERE voter=?;`,
      [profile.discordId]
    )) as { count: number }[];
    return query[0]?.count || 0;
  }

  public static async getNumberOfCardsGifted(
    profile: GameProfile
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM gift WHERE giver=?;`,
      [profile.discordId]
    )) as { count: number }[];
    return query[0]?.count || 0;
  }

  public static async getNumberOfCardsReceivedByGift(
    profile: GameProfile
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM gift WHERE recipient=?;`,
      [profile.discordId]
    )) as { count: number }[];
    return query[0]?.count || 0;
  }

  public static async getClaimInformation(
    card: GameUserCard
  ): Promise<{
    id: number;
    claimer: string;
    dropper: string;
    card_id: number;
    guild_id: string;
    claim_time: string;
    drop_time: string;
  }> {
    const query = (await DB.query(`SELECT * FROM claim WHERE card_id=?;`, [
      card.id,
    ])) as {
      id: number;
      claimer: string;
      dropper: string;
      card_id: number;
      guild_id: string;
      claim_time: string;
      drop_time: string;
    }[];
    return query[0];
  }
}
