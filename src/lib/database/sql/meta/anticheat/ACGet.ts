import { DB } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GameUserCard } from "../../../../../structures/game/UserCard";

export async function getNumberOfClaimedCards(
  profile: GameProfile
): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM claim WHERE claimer=?;`,
    [profile.discordId]
  )) as { count: number }[];
  return query[0]?.count || 0;
}

export async function getNumberOfVotes(profile: GameProfile): Promise<number> {
  const query = (await DB.query(
    `SELECT SUM(1 * (weekend+1)) AS count FROM vote WHERE voter=?;`,
    [profile.discordId]
  )) as { count: number }[];
  return query[0]?.count || 0;
}

export async function getNumberOfCardsGifted(
  profile: GameProfile
): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM gift WHERE giver=?;`,
    [profile.discordId]
  )) as { count: number }[];
  return query[0]?.count || 0;
}

export async function getNumberOfCardsReceivedByGift(
  profile: GameProfile
): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM gift WHERE recipient=?;`,
    [profile.discordId]
  )) as { count: number }[];
  return query[0]?.count || 0;
}

export async function getClaimInformation(
  card: GameUserCard
): Promise<{
  id: number;
  claimer: string;
  dropper: string;
  card_id: number;
  guild_id: string;
  claim_time: string;
  drop_time: string;
  fight_count: number;
  wear: number;
  claimed_after: number;
}> {
  const query = (await DB.query(
    `
      SELECT
        id,
        claimer,
        dropper,
        card_id,
        guild_id,
        claim_time,
        drop_time,
        fight_count,
        wear,
        claimed_after
      FROM
        claim
      WHERE card_id=?;
      `,
    [card.id]
  )) as {
    id: number;
    claimer: string;
    dropper: string;
    card_id: number;
    guild_id: string;
    claim_time: string;
    drop_time: string;
    fight_count: number;
    wear: number;
    claimed_after: number;
  }[];

  return query[0];
}

export async function getNumberOfCardsBurned(
  profile: GameProfile
): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM burn WHERE discord_id=?;`,
    [profile.discordId]
  )) as { count?: number }[];

  return query[0]?.count || 0;
}

export * as ACGet from "./ACGet";
